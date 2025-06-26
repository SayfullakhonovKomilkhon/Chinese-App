-- ============================================================================
-- FIX CATEGORY COMPLETION STATUS
-- ============================================================================
-- This migration fixes the issue where categories never show as "completed"
-- after finishing flashcard sessions. The problem was that categories only
-- showed as "completed" when ALL words were "learned", but in the SuperMemo 2
-- system, words remain active for spaced repetition even after being learned.
--
-- New logic: A category is "completed" when the user has practiced all words
-- at least once, while individual words continue to follow SuperMemo 2 intervals.
-- ============================================================================

-- Function to update category progress with improved completion logic
CREATE OR REPLACE FUNCTION update_category_progress()
RETURNS TRIGGER AS $$
DECLARE
    category_id_val INTEGER;
    category_total INTEGER;
    words_learned_count INTEGER;
    words_started_count INTEGER;
    words_mastered_count INTEGER;
    words_practiced_count INTEGER; -- New: words that have been seen at least once
    completion_pct DECIMAL(5,2);
    new_status VARCHAR(20);
BEGIN
    -- Get the category from the word
    SELECT category_id INTO category_id_val FROM words WHERE id = NEW.word_id;
    
    -- Insert category progress record if it doesn't exist
    INSERT INTO user_category_progress (user_uuid, category_id, total_words)
    SELECT NEW.user_uuid, category_id_val, c.total_words
    FROM categories c
    WHERE c.id = category_id_val
    ON CONFLICT (user_uuid, category_id) DO NOTHING;
    
    -- Count progress - Enhanced logic for better completion tracking
    SELECT 
        COUNT(*) FILTER (WHERE learning_status != 'new' AND learning_status IS NOT NULL),  -- Started (not new)
        COUNT(*) FILTER (WHERE learning_status IN ('learned', 'mastered')),                -- Learned/Mastered
        COUNT(*) FILTER (WHERE learning_status = 'mastered'),                              -- Mastered only
        COUNT(*) FILTER (WHERE total_attempts > 0)                                        -- Practiced (seen at least once)
    INTO words_started_count, words_learned_count, words_mastered_count, words_practiced_count
    FROM user_word_progress uwp
    JOIN words w ON uwp.word_id = w.id
    WHERE uwp.user_uuid = NEW.user_uuid
    AND w.category_id = category_id_val;
    
    -- Get total words in category
    SELECT total_words INTO category_total FROM categories WHERE id = category_id_val;
    
    -- Calculate completion percentage based on words practiced (more realistic)
    completion_pct := CASE 
        WHEN category_total > 0 THEN (words_practiced_count::DECIMAL / category_total) * 100
        ELSE 0
    END;
    
    -- Determine new status with improved logic
    IF words_mastered_count = category_total AND category_total > 0 THEN
        new_status := 'mastered';
    ELSIF words_practiced_count = category_total AND category_total > 0 THEN
        -- Category is completed when user has practiced all words at least once
        -- This allows for spaced repetition while showing completion
        new_status := 'completed';
    ELSIF words_started_count > 0 OR words_practiced_count > 0 THEN
        new_status := 'in_progress';
    ELSE
        new_status := 'not_started';
    END IF;
    
    -- Update category progress
    UPDATE user_category_progress
    SET 
        words_started = words_started_count,
        words_learned = words_learned_count,
        words_mastered = words_mastered_count,
        completion_percentage = completion_pct,
        status = new_status,
        started_at = CASE WHEN new_status != 'not_started' AND started_at IS NULL THEN NOW() ELSE started_at END,
        completed_at = CASE WHEN new_status = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
        mastered_at = CASE WHEN new_status = 'mastered' AND mastered_at IS NULL THEN NOW() ELSE mastered_at END,
        last_studied_at = NOW(),
        updated_at = NOW()
    WHERE user_uuid = NEW.user_uuid AND category_id = category_id_val;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the missing function that's being called by the frontend
CREATE OR REPLACE FUNCTION update_category_progress_easy_based(
    p_user_uuid UUID,
    p_category_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    category_total INTEGER;
    words_learned_count INTEGER;
    words_started_count INTEGER;
    words_mastered_count INTEGER;
    words_practiced_count INTEGER;
    completion_pct DECIMAL(5,2);
    new_status VARCHAR(20);
    v_result JSON;
BEGIN
    -- Insert category progress record if it doesn't exist
    INSERT INTO user_category_progress (user_uuid, category_id, total_words)
    SELECT p_user_uuid, p_category_id, c.total_words
    FROM categories c
    WHERE c.id = p_category_id
    ON CONFLICT (user_uuid, category_id) DO NOTHING;
    
    -- Count progress - Enhanced logic for better completion tracking
    SELECT 
        COUNT(*) FILTER (WHERE learning_status != 'new' AND learning_status IS NOT NULL),  -- Started
        COUNT(*) FILTER (WHERE learning_status IN ('learned', 'mastered')),                -- Learned/Mastered
        COUNT(*) FILTER (WHERE learning_status = 'mastered'),                              -- Mastered only
        COUNT(*) FILTER (WHERE total_attempts > 0)                                        -- Practiced
    INTO words_started_count, words_learned_count, words_mastered_count, words_practiced_count
    FROM user_word_progress uwp
    JOIN words w ON uwp.word_id = w.id
    WHERE uwp.user_uuid = p_user_uuid
    AND w.category_id = p_category_id;
    
    -- Get total words in category
    SELECT total_words INTO category_total FROM categories WHERE id = p_category_id;
    
    -- Calculate completion percentage based on words practiced
    completion_pct := CASE 
        WHEN category_total > 0 THEN (words_practiced_count::DECIMAL / category_total) * 100
        ELSE 0
    END;
    
    -- Determine new status with improved logic
    IF words_mastered_count = category_total AND category_total > 0 THEN
        new_status := 'mastered';
    ELSIF words_practiced_count = category_total AND category_total > 0 THEN
        -- Category is completed when user has practiced all words at least once
        new_status := 'completed';
    ELSIF words_started_count > 0 OR words_practiced_count > 0 THEN
        new_status := 'in_progress';
    ELSE
        new_status := 'not_started';
    END IF;
    
    -- Update category progress
    UPDATE user_category_progress
    SET 
        words_started = words_started_count,
        words_learned = words_learned_count,
        words_mastered = words_mastered_count,
        completion_percentage = completion_pct,
        status = new_status,
        started_at = CASE WHEN new_status != 'not_started' AND started_at IS NULL THEN NOW() ELSE started_at END,
        completed_at = CASE WHEN new_status = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
        mastered_at = CASE WHEN new_status = 'mastered' AND mastered_at IS NULL THEN NOW() ELSE mastered_at END,
        last_studied_at = NOW(),
        updated_at = NOW()
    WHERE user_uuid = p_user_uuid AND category_id = p_category_id;
    
    -- Return result
    SELECT json_build_object(
        'success', true,
        'category_id', p_category_id,
        'status', new_status,
        'completion_percentage', completion_pct,
        'words_practiced', words_practiced_count,
        'words_learned', words_learned_count,
        'words_mastered', words_mastered_count,
        'total_words', category_total
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger to use the new function
DROP TRIGGER IF EXISTS update_category_progress_trigger ON user_word_progress;
CREATE TRIGGER update_category_progress_trigger
    AFTER INSERT OR UPDATE ON user_word_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_category_progress();

-- ============================================================================
-- RECALCULATE EXISTING CATEGORY PROGRESS
-- ============================================================================
-- This will update all existing user category progress records to use the new logic

CREATE OR REPLACE FUNCTION recalculate_all_category_progress()
RETURNS TEXT AS $$
DECLARE
    progress_record RECORD;
    result_count INTEGER := 0;
BEGIN
    -- Loop through all existing user category progress records
    FOR progress_record IN 
        SELECT DISTINCT user_uuid, category_id 
        FROM user_category_progress
    LOOP
        -- Call the updated function for each user-category combination
        PERFORM update_category_progress_easy_based(
            progress_record.user_uuid, 
            progress_record.category_id
        );
        result_count := result_count + 1;
    END LOOP;
    
    RETURN 'Updated ' || result_count || ' category progress records with new completion logic';
END;
$$ LANGUAGE plpgsql;

-- Execute the recalculation
SELECT recalculate_all_category_progress();

-- Drop the temporary function
DROP FUNCTION recalculate_all_category_progress();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Use these to verify the fix is working correctly:

-- Check category completion status for all users
-- SELECT 
--     u.email,
--     c.name_russian as category_name,
--     ucp.status,
--     ucp.completion_percentage,
--     ucp.words_practiced,
--     ucp.words_learned,
--     ucp.total_words
-- FROM user_category_progress ucp
-- JOIN users u ON ucp.user_uuid = u.uuid_id
-- JOIN categories c ON ucp.category_id = c.id
-- ORDER BY u.email, c.difficulty_level;

-- Check words due for review vs category completion status
-- SELECT 
--     c.name_russian,
--     ucp.status as category_status,
--     COUNT(*) as words_due_for_review
-- FROM categories c
-- JOIN words w ON c.id = w.category_id
-- JOIN user_word_progress uwp ON w.id = uwp.word_id
-- JOIN user_category_progress ucp ON c.id = ucp.category_id AND uwp.user_uuid = ucp.user_uuid
-- WHERE uwp.next_review_date <= NOW()
-- GROUP BY c.name_russian, ucp.status
-- ORDER BY c.name_russian; 