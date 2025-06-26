-- ============================================================================
-- SUPERMEMO 2 DYNAMIC CATEGORY COMPLETION
-- ============================================================================
-- This migration implements dynamic category completion that integrates with
-- SuperMemo 2 spaced repetition. Categories will switch between "Completed"
-- and "In Progress" based on scheduled review words, making learning dynamic.
--
-- Key Features:
-- 1. Categories marked "Completed" when all words practiced AND no reviews due
-- 2. Categories automatically return to "In Progress" when words need review
-- 3. Review scheduling respects SuperMemo 2 intervals and difficulty ratings
-- 4. Maintains existing SuperMemo 2 word logic without interference
-- ============================================================================

-- Enhanced function to calculate category completion with review scheduling
CREATE OR REPLACE FUNCTION update_category_progress_with_review_schedule(
    p_user_uuid UUID,
    p_category_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    category_total INTEGER;
    words_practiced_count INTEGER;
    words_due_today INTEGER;
    words_due_soon INTEGER; -- Due within next 2 days
    completion_pct DECIMAL(5,2);
    new_status VARCHAR(20);
    next_review_date TIMESTAMP;
    v_result JSON;
BEGIN
    -- Insert category progress record if it doesn't exist
    INSERT INTO user_category_progress (user_uuid, category_id, total_words)
    SELECT p_user_uuid, p_category_id, c.total_words
    FROM categories c
    WHERE c.id = p_category_id
    ON CONFLICT (user_uuid, category_id) DO NOTHING;
    
    -- Get total words in category
    SELECT total_words INTO category_total FROM categories WHERE id = p_category_id;
    
    -- Count words that have been practiced (total_attempts > 0)
    SELECT COUNT(*) 
    INTO words_practiced_count
    FROM user_word_progress uwp
    JOIN words w ON uwp.word_id = w.id
    WHERE uwp.user_uuid = p_user_uuid
    AND w.category_id = p_category_id
    AND uwp.total_attempts > 0;
    
    -- Count words due for review TODAY (considering SuperMemo 2 intervals)
    SELECT COUNT(*)
    INTO words_due_today
    FROM user_word_progress uwp
    JOIN words w ON uwp.word_id = w.id
    WHERE uwp.user_uuid = p_user_uuid
    AND w.category_id = p_category_id
    AND uwp.total_attempts > 0  -- Only practiced words
    AND uwp.next_review_date <= NOW()  -- Due now or overdue
    -- Exclude words marked as "easy" in last review (they don't need frequent review)
    AND (uwp.last_difficulty IS NULL OR uwp.last_difficulty != 'easy' OR uwp.next_review_date <= NOW());
    
    -- Count words due SOON (within next 2 days)
    SELECT COUNT(*)
    INTO words_due_soon
    FROM user_word_progress uwp
    JOIN words w ON uwp.word_id = w.id
    WHERE uwp.user_uuid = p_user_uuid
    AND w.category_id = p_category_id
    AND uwp.total_attempts > 0
    AND uwp.next_review_date <= NOW() + INTERVAL '2 days'
    AND (uwp.last_difficulty IS NULL OR uwp.last_difficulty != 'easy' OR uwp.next_review_date <= NOW() + INTERVAL '2 days');
    
    -- Find the next scheduled review date for this category
    SELECT MIN(uwp.next_review_date)
    INTO next_review_date
    FROM user_word_progress uwp
    JOIN words w ON uwp.word_id = w.id
    WHERE uwp.user_uuid = p_user_uuid
    AND w.category_id = p_category_id
    AND uwp.total_attempts > 0
    AND uwp.next_review_date > NOW();
    
    -- Calculate completion percentage based on words practiced
    completion_pct := CASE 
        WHEN category_total > 0 THEN (words_practiced_count::DECIMAL / category_total) * 100
        ELSE 0
    END;
    
    -- DYNAMIC STATUS LOGIC - The core of the enhancement
    IF words_practiced_count = 0 THEN
        -- No words practiced yet
        new_status := 'not_started';
    ELSIF words_practiced_count < category_total THEN
        -- Still have unpracticed words
        new_status := 'in_progress';
    ELSIF words_due_today > 0 THEN
        -- All words practiced BUT some are due for review TODAY
        new_status := 'in_progress';
    ELSIF words_due_soon > 0 THEN
        -- All words practiced, none due today, but some due soon
        new_status := 'in_progress';
    ELSE
        -- All words practiced and none are due for review
        new_status := 'completed';
    END IF;
    
    -- Update category progress with enhanced review tracking
    UPDATE user_category_progress
    SET 
        words_started = words_practiced_count,
        words_learned = words_practiced_count,  -- Keep for compatibility
        completion_percentage = completion_pct,
        status = new_status,
        started_at = CASE WHEN new_status != 'not_started' AND started_at IS NULL THEN NOW() ELSE started_at END,
        completed_at = CASE WHEN new_status = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
        last_studied_at = NOW(),
        updated_at = NOW()
    WHERE user_uuid = p_user_uuid AND category_id = p_category_id;
    
    -- Return comprehensive result
    SELECT json_build_object(
        'success', true,
        'category_id', p_category_id,
        'status', new_status,
        'completion_percentage', completion_pct,
        'words_practiced', words_practiced_count,
        'words_due_today', words_due_today,
        'words_due_soon', words_due_soon,
        'total_words', category_total,
        'next_review_date', next_review_date,
        'is_dynamic', true
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get words due for review in a specific category
CREATE OR REPLACE FUNCTION get_category_review_summary(
    p_user_uuid UUID,
    p_category_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'category_id', p_category_id,
        'words_due_today', COUNT(*) FILTER (WHERE uwp.next_review_date <= NOW()),
        'words_due_tomorrow', COUNT(*) FILTER (WHERE uwp.next_review_date <= NOW() + INTERVAL '1 day' AND uwp.next_review_date > NOW()),
        'words_due_this_week', COUNT(*) FILTER (WHERE uwp.next_review_date <= NOW() + INTERVAL '7 days' AND uwp.next_review_date > NOW()),
        'next_review_date', MIN(uwp.next_review_date) FILTER (WHERE uwp.next_review_date > NOW()),
        'overdue_words', COUNT(*) FILTER (WHERE uwp.next_review_date < NOW() - INTERVAL '1 day'),
        'last_difficulty_breakdown', json_object_agg(
            COALESCE(uwp.last_difficulty, 'new'), 
            COUNT(*) FILTER (WHERE COALESCE(uwp.last_difficulty, 'new') = COALESCE(uwp.last_difficulty, 'new'))
        )
    )
    INTO v_result
    FROM user_word_progress uwp
    JOIN words w ON uwp.word_id = w.id
    WHERE uwp.user_uuid = p_user_uuid
    AND w.category_id = p_category_id
    AND uwp.total_attempts > 0;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recalculate ALL category progress with dynamic review scheduling
CREATE OR REPLACE FUNCTION update_all_categories_with_review_schedule(
    p_user_uuid UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    progress_record RECORD;
    result_count INTEGER := 0;
BEGIN
    -- Loop through all user-category combinations (or specific user if provided)
    FOR progress_record IN 
        SELECT DISTINCT uwp.user_uuid, w.category_id 
        FROM user_word_progress uwp
        JOIN words w ON uwp.word_id = w.id
        WHERE (p_user_uuid IS NULL OR uwp.user_uuid = p_user_uuid)
        AND uwp.total_attempts > 0  -- Only categories with practiced words
    LOOP
        -- Update each category with dynamic review scheduling
        PERFORM update_category_progress_with_review_schedule(
            progress_record.user_uuid, 
            progress_record.category_id
        );
        result_count := result_count + 1;
    END LOOP;
    
    RETURN 'Updated ' || result_count || ' category progress records with dynamic review scheduling';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger to use the new dynamic function
DROP TRIGGER IF EXISTS update_category_progress_trigger ON user_word_progress;
CREATE TRIGGER update_category_progress_trigger
    AFTER INSERT OR UPDATE ON user_word_progress
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_category_progress_dynamic();

-- Trigger function that calls the dynamic update
CREATE OR REPLACE FUNCTION trigger_update_category_progress_dynamic()
RETURNS TRIGGER AS $$
DECLARE
    category_id_val INTEGER;
BEGIN
    -- Get the category from the word
    SELECT category_id INTO category_id_val FROM words WHERE id = NEW.word_id;
    
    -- Update category progress with dynamic review scheduling
    PERFORM update_category_progress_with_review_schedule(NEW.user_uuid, category_id_val);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- APPLY DYNAMIC COMPLETION TO ALL EXISTING DATA
-- ============================================================================
-- Run this to update all existing category progress with the new dynamic logic
-- SELECT update_all_categories_with_review_schedule();
