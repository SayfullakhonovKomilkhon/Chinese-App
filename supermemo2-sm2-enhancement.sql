-- ============================================================================
-- SUPERMEMO 2 ALGORITHM ENHANCEMENT
-- ============================================================================
-- This migration enhances the existing spaced repetition system to implement
-- the exact SuperMemo 2 algorithm with difficulty level conditions
-- ============================================================================

-- ============================================================================
-- 1. ENHANCED GET WORDS FOR STUDY FUNCTION (SM2 + Difficulty Level Logic)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_words_for_study(
    p_user_uuid UUID,
    p_category_id INTEGER,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    word_id INTEGER,
    chinese_simplified VARCHAR,
    chinese_traditional VARCHAR,
    pinyin VARCHAR,
    russian_translation VARCHAR,
    english_translation VARCHAR,
    example_sentence_chinese TEXT,
    example_sentence_russian TEXT,
    audio_url VARCHAR,
    learning_status VARCHAR,
    repetition_count INTEGER,
    next_review_date TIMESTAMP WITH TIME ZONE,
    category_difficulty INTEGER,
    easiness_factor DECIMAL,
    interval_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH word_priorities AS (
        SELECT 
            w.id,
            w.chinese_simplified,
            w.chinese_traditional,
            w.pinyin,
            w.russian_translation,
            w.english_translation,
            w.example_sentence_chinese,
            w.example_sentence_russian,
            w.audio_url,
            COALESCE(uwp.learning_status, 'new') as learning_status,
            COALESCE(uwp.repetition_count, 0) as repetition_count,
            COALESCE(uwp.next_review_date, NOW()) as next_review_date,
            c.difficulty_level as category_difficulty,
            COALESCE(uwp.easiness_factor, 2.5) as easiness_factor,
            COALESCE(uwp.interval_days, 1) as interval_days,
            -- Enhanced Priority calculation (lower number = higher priority)
            -- Uses SuperMemo 2 values to prioritize forgotten words based on memory performance
            CASE 
                -- Highest priority: New words that haven't been seen
                WHEN uwp.learning_status IS NULL OR uwp.learning_status = 'new' THEN 1
                
                -- Second priority: Words frequently forgotten (low easiness factor + poor accuracy)
                WHEN uwp.learning_status = 'learning' 
                     AND uwp.easiness_factor <= 1.5 
                     AND COALESCE(uwp.accuracy_percentage, 0) < 50 
                     AND uwp.total_attempts >= 3 THEN 2
                
                -- Third priority: Words with recent failures (low easiness factor)
                WHEN uwp.learning_status = 'learning' 
                     AND uwp.easiness_factor <= 1.8 
                     AND uwp.total_attempts >= 2 THEN 3
                
                -- Fourth priority: Words due for review with medium difficulty
                WHEN uwp.learning_status = 'learning' 
                     AND uwp.next_review_date <= NOW() 
                     AND uwp.easiness_factor <= 2.2 THEN 4
                
                -- Fifth priority: Hard categories show daily regardless of interval
                WHEN c.difficulty_level >= 3 THEN 5
                
                -- Sixth priority: Regular words due for review
                WHEN uwp.learning_status = 'learning' 
                     AND uwp.next_review_date <= NOW() THEN 6
                
                -- Seventh priority: Learning words not yet due but with low accuracy
                WHEN uwp.learning_status = 'learning' 
                     AND COALESCE(uwp.accuracy_percentage, 0) < 70 THEN 7
                
                -- Eighth priority: Learned words due for review
                WHEN uwp.learning_status = 'learned' 
                     AND uwp.next_review_date <= NOW() THEN 8
                
                -- Ninth priority: Learned words not yet due (for reinforcement)
                WHEN uwp.learning_status = 'learned' THEN 9
                
                -- Lowest priority: Other words
                ELSE 10
            END as priority,
            
            -- Memory performance score for secondary sorting (lower = more forgotten)
            CASE 
                WHEN uwp.total_attempts = 0 THEN 0  -- New words
                ELSE 
                    -- Combine easiness factor and accuracy for memory performance
                    (uwp.easiness_factor * COALESCE(uwp.accuracy_percentage, 0)) / 100
            END as memory_performance
        FROM words w
        JOIN categories c ON w.category_id = c.id
        LEFT JOIN user_word_progress uwp ON w.id = uwp.word_id AND uwp.user_uuid = p_user_uuid
        WHERE w.category_id = p_category_id
        AND w.is_active = true
        AND c.is_active = true
        -- FIXED: Only exclude mastered words, allow all others including learned words
        AND (uwp.learning_status IS NULL OR uwp.learning_status != 'mastered')
        -- CRITICAL FILTER: Exclude cards marked as "easy" in their last review
        -- Only show new words OR words that were marked as "hard" or "forgot"
        AND (
            uwp.last_difficulty IS NULL  -- New words (never answered)
            OR uwp.last_difficulty = 'hard'   -- Hard cards (need more practice)
            OR uwp.last_difficulty = 'forgot' -- Forgot cards (need repetition)
        )
        ORDER BY priority ASC, memory_performance ASC, uwp.next_review_date ASC NULLS FIRST, RANDOM()
        LIMIT p_limit
    )
    SELECT 
        wp.id::INTEGER as word_id,
        wp.chinese_simplified,
        wp.chinese_traditional,
        wp.pinyin,
        wp.russian_translation,
        wp.english_translation,
        wp.example_sentence_chinese,
        wp.example_sentence_russian,
        wp.audio_url,
        wp.learning_status,
        wp.repetition_count,
        wp.next_review_date,
        wp.category_difficulty,
        wp.easiness_factor,
        wp.interval_days
    FROM word_priorities wp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. ENHANCED SUBMIT WORD RESPONSE (Exact SM2 Formula)
-- ============================================================================
CREATE OR REPLACE FUNCTION submit_word_response(
    p_user_uuid UUID,
    p_word_id INTEGER,
    p_difficulty VARCHAR, -- 'easy', 'hard', 'forgot'
    p_was_correct BOOLEAN DEFAULT true,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_session_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_progress user_word_progress%ROWTYPE;
    v_new_interval INTEGER;
    v_new_easiness DECIMAL(3,2);
    v_new_status VARCHAR(20);
    v_new_repetition_count INTEGER;
    v_quality INTEGER; -- SM-2 algorithm quality (0-5)
    v_category_difficulty INTEGER;
    v_initial_easiness DECIMAL(3,2);
    v_result JSON;
BEGIN
    -- Convert difficulty to SM-2 quality rating
    v_quality := CASE p_difficulty
        WHEN 'easy' THEN 5      -- Perfect response
        WHEN 'hard' THEN 3      -- Correct but difficult
        WHEN 'forgot' THEN 0    -- Incorrect
        ELSE 3
    END;
    
    -- Get or create user word progress
    SELECT * INTO v_current_progress
    FROM user_word_progress
    WHERE user_uuid = p_user_uuid AND word_id = p_word_id;
    
    IF NOT FOUND THEN
        -- Get category difficulty for initial easiness factor
        SELECT c.difficulty_level INTO v_category_difficulty
        FROM words w
        JOIN categories c ON w.category_id = c.id
        WHERE w.id = p_word_id;
        
        -- Set initial easiness factor based on category difficulty (HSK level)
        v_initial_easiness := CASE 
            WHEN v_category_difficulty = 1 THEN 2.6  -- HSK 1
            WHEN v_category_difficulty = 2 THEN 2.4  -- HSK 2  
            ELSE 2.2  -- HSK 3+
        END;
        
        -- Create new progress record with category-based initial values
        INSERT INTO user_word_progress (
            user_uuid, word_id, learning_status, repetition_count, 
            easiness_factor, interval_days, next_review_date
        ) VALUES (
            p_user_uuid, p_word_id, 'new', 0, v_initial_easiness, 1, NOW()
        ) RETURNING * INTO v_current_progress;
    END IF;
    
    -- Apply SuperMemo 2 algorithm for easiness factor using the exact formula:
    -- EF' = EF - 0.8 + 0.28 * quality - 0.02 * quality²
    v_new_easiness := v_current_progress.easiness_factor - 0.8 + 0.28 * v_quality - 0.02 * (v_quality * v_quality);
    v_new_easiness := GREATEST(v_new_easiness, 1.3); -- Minimum easiness factor
    
    -- Calculate repetition count and interval based on SM-2 algorithm
    IF v_quality < 3 THEN
        -- Failed response (quality 0-2) - reset repetition count and interval
        v_new_repetition_count := 0;
        v_new_interval := 1;
        v_new_status := CASE 
            WHEN v_current_progress.learning_status = 'new' THEN 'learning'
            ELSE v_current_progress.learning_status
        END;
    ELSE
        -- Successful response (quality 3-5) - increment repetition and calculate interval
        v_new_repetition_count := v_current_progress.repetition_count + 1;
        
        -- SM-2 interval calculation
        IF v_new_repetition_count = 1 THEN
            v_new_interval := 1;  -- First repetition: 1 day
        ELSIF v_new_repetition_count = 2 THEN
            v_new_interval := 6;  -- Second repetition: 6 days
        ELSE
            -- Subsequent repetitions: previous interval × easiness factor
            v_new_interval := ROUND(v_current_progress.interval_days * v_new_easiness);
        END IF;
        
        -- Update learning status based on performance and repetition count
        v_new_status := CASE 
            WHEN v_current_progress.learning_status = 'new' THEN 'learning'
            WHEN v_new_repetition_count >= 3 AND v_quality >= 4 THEN 'learned'
            WHEN v_new_repetition_count >= 6 AND v_quality = 5 THEN 'mastered'
            ELSE COALESCE(v_current_progress.learning_status, 'learning')
        END;
    END IF;
    
    -- Update user word progress with SM-2 calculated values
    UPDATE user_word_progress
    SET 
        learning_status = v_new_status,
        last_difficulty = p_difficulty,
        repetition_count = v_new_repetition_count,
        easiness_factor = v_new_easiness,
        interval_days = v_new_interval,
        next_review_date = NOW() + (v_new_interval || ' days')::INTERVAL,
        correct_answers = correct_answers + CASE WHEN p_was_correct THEN 1 ELSE 0 END,
        total_attempts = total_attempts + 1,
        accuracy_percentage = ROUND(
            ((correct_answers + CASE WHEN p_was_correct THEN 1 ELSE 0 END)::DECIMAL / 
             (total_attempts + 1)) * 100, 2
        ),
        last_seen_at = NOW(),
        learned_at = CASE WHEN v_new_status = 'learned' AND learned_at IS NULL THEN NOW() ELSE learned_at END,
        mastered_at = CASE WHEN v_new_status = 'mastered' AND mastered_at IS NULL THEN NOW() ELSE mastered_at END,
        updated_at = NOW()
    WHERE user_uuid = p_user_uuid AND word_id = p_word_id;
    
    -- Log activity
    INSERT INTO user_activity (
        user_uuid, word_id, session_id, activity_type, 
        difficulty_rating, was_correct, response_time_ms
    ) VALUES (
        p_user_uuid, p_word_id, p_session_id, 'word_response',
        p_difficulty, p_was_correct, p_response_time_ms
    );
    
    -- Return result with SM-2 calculated values
    SELECT json_build_object(
        'success', true,
        'new_status', v_new_status,
        'next_review_date', NOW() + (v_new_interval || ' days')::INTERVAL,
        'interval_days', v_new_interval,
        'easiness_factor', v_new_easiness,
        'repetition_count', v_new_repetition_count,
        'quality_rating', v_quality,
        'difficulty_rating', p_difficulty
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. VERIFICATION QUERY
-- ============================================================================
-- Test query to verify the enhanced functionality
-- SELECT * FROM get_words_for_study('user-uuid-here', 1, 10);
-- SELECT submit_word_response('user-uuid-here', 1, 'easy', true, 1500, 1); 