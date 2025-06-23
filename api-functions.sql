-- ============================================================================
-- API FUNCTIONS FOR CHINESE LEARNING APPLICATION
-- ============================================================================
-- These functions provide the backend logic for flashcard learning,
-- progress tracking, and spaced repetition algorithm
-- ============================================================================

-- ============================================================================
-- 1. GET WORDS FOR STUDY SESSION
-- ============================================================================
-- Returns words that need to be studied based on spaced repetition
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
    next_review_date TIMESTAMP WITH TIME ZONE
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
            -- Priority calculation (lower number = higher priority)
            CASE 
                WHEN uwp.learning_status IS NULL OR uwp.learning_status = 'new' THEN 1
                WHEN uwp.learning_status = 'learning' AND uwp.next_review_date <= NOW() THEN 2
                WHEN uwp.learning_status = 'learning' THEN 3
                ELSE 4
            END as priority
        FROM words w
        LEFT JOIN user_word_progress uwp ON w.id = uwp.word_id AND uwp.user_uuid = p_user_uuid
        WHERE w.category_id = p_category_id
        AND w.is_active = true
        AND (uwp.learning_status IS NULL OR uwp.learning_status != 'mastered')
        ORDER BY priority ASC, uwp.next_review_date ASC NULLS FIRST, RANDOM()
        LIMIT p_limit
    )
    SELECT 
        wp.id::INTEGER,
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
        wp.next_review_date
    FROM word_priorities wp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. SUBMIT WORD RESPONSE (Main function for flashcard feedback)
-- ============================================================================
-- Records user response and updates learning progress
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
-- 3. START STUDY SESSION
-- ============================================================================
-- Creates a new study session
CREATE OR REPLACE FUNCTION start_study_session(
    p_user_uuid UUID,
    p_category_id INTEGER,
    p_session_type VARCHAR DEFAULT 'study'
)
RETURNS JSON AS $$
DECLARE
    v_session_id INTEGER;
    v_result JSON;
BEGIN
    -- Create new session
    INSERT INTO user_sessions (
        user_uuid, category_id, session_type, started_at
    ) VALUES (
        p_user_uuid, p_category_id, p_session_type, NOW()
    ) RETURNING id INTO v_session_id;
    
    -- Log activity
    INSERT INTO user_activity (
        user_uuid, session_id, activity_type
    ) VALUES (
        p_user_uuid, v_session_id, 'session_started'
    );
    
    SELECT json_build_object(
        'success', true,
        'session_id', v_session_id,
        'started_at', NOW()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. END STUDY SESSION
-- ============================================================================
-- Completes a study session and updates statistics
CREATE OR REPLACE FUNCTION end_study_session(
    p_user_uuid UUID,
    p_session_id INTEGER,
    p_words_studied INTEGER,
    p_words_learned INTEGER,
    p_correct_answers INTEGER,
    p_total_answers INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_duration INTEGER;
    v_result JSON;
BEGIN
    -- Calculate session duration
    SELECT EXTRACT(EPOCH FROM (NOW() - started_at)) / 60 INTO v_duration
    FROM user_sessions
    WHERE id = p_session_id AND user_uuid = p_user_uuid;
    
    -- Update session
    UPDATE user_sessions
    SET 
        words_studied = p_words_studied,
        words_learned = p_words_learned,
        correct_answers = p_correct_answers,
        total_answers = p_total_answers,
        session_accuracy = CASE 
            WHEN p_total_answers > 0 THEN ROUND((p_correct_answers::DECIMAL / p_total_answers) * 100, 2)
            ELSE 0
        END,
        duration_minutes = COALESCE(v_duration, 0),
        ended_at = NOW()
    WHERE id = p_session_id AND user_uuid = p_user_uuid;
    
    -- Update daily statistics
    INSERT INTO user_statistics (user_uuid)
    VALUES (p_user_uuid)
    ON CONFLICT (user_uuid) DO NOTHING;
    
    UPDATE user_statistics
    SET 
        total_sessions = total_sessions + 1,
        total_study_minutes = total_study_minutes + COALESCE(v_duration, 0),
        average_session_minutes = ROUND(
            (total_study_minutes + COALESCE(v_duration, 0))::DECIMAL / (total_sessions + 1), 2
        ),
        words_learned_today = CASE 
            WHEN last_activity_date = CURRENT_DATE THEN words_learned_today + p_words_learned
            ELSE p_words_learned
        END,
        minutes_studied_today = CASE 
            WHEN last_activity_date = CURRENT_DATE THEN minutes_studied_today + COALESCE(v_duration, 0)
            ELSE COALESCE(v_duration, 0)
        END,
        last_activity_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE user_uuid = p_user_uuid;
    
    -- Update streak
    PERFORM update_user_streak(p_user_uuid);
    
    -- Log activity
    INSERT INTO user_activity (
        user_uuid, session_id, activity_type
    ) VALUES (
        p_user_uuid, p_session_id, 'session_completed'
    );
    
    SELECT json_build_object(
        'success', true,
        'session_duration_minutes', COALESCE(v_duration, 0),
        'words_studied', p_words_studied,
        'words_learned', p_words_learned,
        'accuracy', CASE 
            WHEN p_total_answers > 0 THEN ROUND((p_correct_answers::DECIMAL / p_total_answers) * 100, 2)
            ELSE 0
        END
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. UPDATE USER STREAK
-- ============================================================================
-- Updates user's daily streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    v_last_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
BEGIN
    SELECT last_activity_date, current_streak_days, longest_streak_days
    INTO v_last_date, v_current_streak, v_longest_streak
    FROM user_statistics
    WHERE user_uuid = p_user_uuid;
    
    IF v_last_date IS NULL THEN
        -- First activity
        UPDATE user_statistics
        SET current_streak_days = 1,
            longest_streak_days = GREATEST(longest_streak_days, 1),
            total_active_days = 1
        WHERE user_uuid = p_user_uuid;
    ELSIF v_last_date = CURRENT_DATE THEN
        -- Same day, no change to streak
        RETURN;
    ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Consecutive day
        UPDATE user_statistics
        SET current_streak_days = current_streak_days + 1,
            longest_streak_days = GREATEST(longest_streak_days, current_streak_days + 1),
            total_active_days = total_active_days + 1
        WHERE user_uuid = p_user_uuid;
    ELSE
        -- Streak broken
        UPDATE user_statistics
        SET current_streak_days = 1,
            total_active_days = total_active_days + 1
        WHERE user_uuid = p_user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. GET USER DASHBOARD DATA
-- ============================================================================
-- Returns comprehensive dashboard data for user
CREATE OR REPLACE FUNCTION get_user_dashboard(p_user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    v_stats user_statistics%ROWTYPE;
    v_categories JSON;
    v_result JSON;
BEGIN
    -- Get user statistics
    SELECT * INTO v_stats
    FROM user_statistics
    WHERE user_uuid = p_user_uuid;
    
    -- If no stats exist, create default record
    IF NOT FOUND THEN
        INSERT INTO user_statistics (user_uuid)
        VALUES (p_user_uuid)
        RETURNING * INTO v_stats;
    END IF;
    
    -- Get categories with progress
    SELECT json_agg(
        json_build_object(
            'id', c.id,
            'name', c.name,
            'name_russian', c.name_russian,
            'description', c.description,
            'description_russian', c.description_russian,
            'difficulty_level', c.difficulty_level,
            'total_words', c.total_words,
            'progress', COALESCE(
                json_build_object(
                    'status', ucp.status,
                    'words_learned', ucp.words_learned,
                    'words_started', ucp.words_started,
                    'completion_percentage', ucp.completion_percentage,
                    'last_studied_at', ucp.last_studied_at
                ),
                json_build_object(
                    'status', 'not_started',
                    'words_learned', 0,
                    'words_started', 0,
                    'completion_percentage', 0,
                    'last_studied_at', null
                )
            )
        )
        ORDER BY 
            CASE WHEN COALESCE(ucp.status, 'not_started') = 'completed' THEN 1 ELSE 0 END,
            c.display_order,
            c.difficulty_level
    ) INTO v_categories
    FROM categories c
    LEFT JOIN user_category_progress ucp ON c.id = ucp.category_id AND ucp.user_uuid = p_user_uuid
    WHERE c.is_active = true;
    
    -- Build result
    SELECT json_build_object(
        'statistics', json_build_object(
            'total_words_viewed', v_stats.total_words_viewed,
            'total_words_learned', v_stats.total_words_learned,
            'total_words_mastered', v_stats.total_words_mastered,
            'total_sessions', v_stats.total_sessions,
            'total_study_minutes', v_stats.total_study_minutes,
            'current_streak_days', v_stats.current_streak_days,
            'longest_streak_days', v_stats.longest_streak_days,
            'words_learned_today', CASE 
                WHEN v_stats.last_activity_date = CURRENT_DATE THEN v_stats.words_learned_today
                ELSE 0
            END,
            'minutes_studied_today', CASE 
                WHEN v_stats.last_activity_date = CURRENT_DATE THEN v_stats.minutes_studied_today
                ELSE 0
            END,
            'overall_accuracy', v_stats.overall_accuracy,
            'categories_completed', v_stats.categories_completed
        ),
        'categories', v_categories
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. RESET USER PROGRESS (for testing/admin)
-- ============================================================================
-- Resets all progress for a user (use carefully!)
CREATE OR REPLACE FUNCTION reset_user_progress(p_user_uuid UUID)
RETURNS JSON AS $$
BEGIN
    -- Delete user progress data
    DELETE FROM user_word_progress WHERE user_uuid = p_user_uuid;
    DELETE FROM user_category_progress WHERE user_uuid = p_user_uuid;
    DELETE FROM user_sessions WHERE user_uuid = p_user_uuid;
    DELETE FROM user_activity WHERE user_uuid = p_user_uuid;
    
    -- Reset statistics
    UPDATE user_statistics
    SET 
        total_words_viewed = 0,
        total_words_learned = 0,
        total_words_mastered = 0,
        total_sessions = 0,
        total_study_minutes = 0,
        current_streak_days = 0,
        longest_streak_days = 0,
        total_active_days = 0,
        words_learned_today = 0,
        minutes_studied_today = 0,
        overall_accuracy = 0,
        categories_completed = 0,
        categories_mastered = 0,
        last_activity_date = null,
        updated_at = NOW()
    WHERE user_uuid = p_user_uuid;
    
    RETURN json_build_object('success', true, 'message', 'User progress reset successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- API FUNCTIONS COMPLETE
-- ============================================================================
-- These functions provide all the backend logic needed for:
-- ✅ Spaced repetition learning system
-- ✅ Word difficulty tracking (easy/hard/forgot)
-- ✅ Session management and statistics
-- ✅ Category progress tracking  
-- ✅ Dashboard data aggregation
-- ✅ User streak calculation
-- ============================================================================ 