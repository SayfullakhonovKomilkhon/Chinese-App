-- ============================================================================
-- SUPERMEMO 2 ALGORITHM INTEGRATION
-- ============================================================================
-- Enhanced submit_word_response function with full SM-2 implementation
-- Includes category-based initial easiness factors based on HSK difficulty levels
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
    
    -- Apply SuperMemo 2 algorithm for easiness factor
    v_new_easiness := v_current_progress.easiness_factor + (0.1 - (5 - v_quality) * (0.08 + (5 - v_quality) * 0.02));
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
        'repetition_count', v_new_repetition_count,
        'easiness_factor', v_new_easiness,
        'quality', v_quality
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Use this query to test the new SM-2 implementation:
/*
-- Test with HSK 1 word (should get easiness_factor 2.6)
SELECT submit_word_response(
    'your-user-uuid'::UUID, 
    1, -- word_id for HSK 1 word
    'easy'
);

-- Test with HSK 3+ word (should get easiness_factor 2.2)  
SELECT submit_word_response(
    'your-user-uuid'::UUID,
    10, -- word_id for HSK 3+ word  
    'hard'
);
*/ 