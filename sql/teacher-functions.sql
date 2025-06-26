-- =====================================================
-- TEACHER MANAGEMENT SQL FUNCTIONS
-- =====================================================
-- Functions to support teacher panel operations
-- Including student management, content management, and analytics
-- =====================================================

-- Get all students with their progress overview
CREATE OR REPLACE FUNCTION get_all_students_progress()
RETURNS TABLE (
  user_uuid UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  total_words_learned INTEGER,
  total_sessions INTEGER,
  overall_accuracy NUMERIC,
  current_streak_days INTEGER,
  categories_completed INTEGER,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  is_active_today BOOLEAN,
  total_study_minutes INTEGER,
  words_learned_today INTEGER,
  minutes_studied_today INTEGER,
  total_words_viewed INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.uuid_id,
    u.email,
    COALESCE(u.full_name, u.email) as full_name,
    u.role,
    COALESCE(us.total_words_learned, 0)::INTEGER,
    COALESCE(us.total_sessions, 0)::INTEGER,
    COALESCE(us.overall_accuracy, 0)::NUMERIC,
    COALESCE(us.current_streak_days, 0)::INTEGER,
    COALESCE(us.categories_completed, 0)::INTEGER,
    COALESCE(us.last_activity_date, u.created_at),
    CASE 
      WHEN us.last_activity_date::DATE = CURRENT_DATE THEN TRUE 
      ELSE FALSE 
    END as is_active_today,
    COALESCE(us.total_study_minutes, 0)::INTEGER,
    COALESCE(us.words_learned_today, 0)::INTEGER,
    COALESCE(us.minutes_studied_today, 0)::INTEGER,
    COALESCE(us.total_words_viewed, 0)::INTEGER
  FROM users u
  LEFT JOIN user_statistics us ON u.uuid_id = us.user_uuid
  WHERE u.role = 'student'
  ORDER BY us.last_activity_date DESC NULLS LAST;
END;
$$;

-- Get detailed progress for a specific student
CREATE OR REPLACE FUNCTION get_student_detailed_progress(target_user_uuid UUID)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
  user_data JSON;
  category_progress JSON;
  recent_sessions JSON;
BEGIN
  -- Get user basic information
  SELECT to_json(user_info) INTO user_data
  FROM (
    SELECT 
      u.uuid,
      u.email,
      COALESCE(u.full_name, u.email) as full_name,
      u.role,
      us.total_words_learned,
      us.total_sessions,
      us.overall_accuracy,
      us.current_streak_days,
      us.categories_completed,
      us.last_activity_date
    FROM users u
    LEFT JOIN user_statistics us ON u.uuid = us.user_uuid
    WHERE u.uuid = target_user_uuid
  ) user_info;

  -- Get category progress
  SELECT json_agg(cat_progress) INTO category_progress
  FROM (
    SELECT 
      ucp.*,
      c.name,
      c.name_russian,
      c.difficulty_level
    FROM user_category_progress ucp
    JOIN categories c ON c.id = ucp.category_id
    WHERE ucp.user_uuid = target_user_uuid
    ORDER BY ucp.last_studied_at DESC NULLS LAST
    LIMIT 10
  ) cat_progress;

  -- Get recent sessions
  SELECT json_agg(session_data) INTO recent_sessions
  FROM (
    SELECT 
      us.*,
      c.name as category_name,
      c.name_russian as category_name_russian
    FROM user_sessions us
    LEFT JOIN categories c ON c.id = us.category_id
    WHERE us.user_uuid = target_user_uuid
    ORDER BY us.started_at DESC
    LIMIT 10
  ) session_data;

  -- Combine all data
  SELECT json_build_object(
    'user', user_data,
    'category_progress', COALESCE(category_progress, '[]'::json),
    'recent_sessions', COALESCE(recent_sessions, '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;

-- Get all content (words) with usage statistics
CREATE OR REPLACE FUNCTION get_all_content_with_stats(category_filter INTEGER DEFAULT NULL)
RETURNS TABLE (
  id INTEGER,
  category_id INTEGER,
  chinese_simplified TEXT,
  chinese_traditional TEXT,
  pinyin TEXT,
  russian_translation TEXT,
  english_translation TEXT,
  example_sentence_chinese TEXT,
  example_sentence_russian TEXT,
  audio_url TEXT,
  difficulty_level INTEGER,
  frequency_rank INTEGER,
  is_active BOOLEAN,
  category_name TEXT,
  category_difficulty INTEGER,
  total_learners BIGINT,
  average_accuracy NUMERIC,
  times_studied BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.category_id,
    w.chinese_simplified,
    w.chinese_traditional,
    w.pinyin,
    w.russian_translation,
    w.english_translation,
    w.example_sentence_chinese,
    w.example_sentence_russian,
    w.audio_url,
    w.difficulty_level,
    w.frequency_rank,
    w.is_active,
    c.name_russian as category_name,
    c.difficulty_level as category_difficulty,
    COALESCE(COUNT(DISTINCT uwp.user_uuid), 0) as total_learners,
    COALESCE(AVG(uwp.accuracy_percentage), 0)::NUMERIC as average_accuracy,
    COALESCE(SUM(uwp.total_attempts), 0) as times_studied
  FROM words w
  JOIN categories c ON c.id = w.category_id
  LEFT JOIN user_word_progress uwp ON uwp.word_id = w.id
  WHERE (category_filter IS NULL OR w.category_id = category_filter)
    AND w.is_active = true
  GROUP BY w.id, c.name_russian, c.difficulty_level
  ORDER BY w.id DESC;
END;
$$;

-- Get teacher analytics dashboard data
CREATE OR REPLACE FUNCTION get_teacher_analytics()
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
  platform_stats JSON;
  student_engagement JSON;
  content_usage JSON;
BEGIN
  -- Platform statistics
  SELECT json_build_object(
    'total_students', (SELECT COUNT(*) FROM users WHERE role = 'student' AND email_verified = true),
    'active_students_today', (SELECT COUNT(*) FROM user_statistics WHERE last_activity_date::DATE = CURRENT_DATE),
    'total_words_in_system', (SELECT COUNT(*) FROM words WHERE is_active = true),
    'total_sessions_today', (SELECT COUNT(*) FROM user_sessions WHERE started_at::DATE = CURRENT_DATE),
    'platform_accuracy', (SELECT COALESCE(AVG(overall_accuracy), 0) FROM user_statistics WHERE overall_accuracy > 0)
  ) INTO platform_stats;

  -- Student engagement metrics
  SELECT json_build_object(
    'students_with_streak', (SELECT COUNT(*) FROM user_statistics WHERE current_streak_days > 0),
    'average_streak_length', (SELECT COALESCE(AVG(current_streak_days), 0) FROM user_statistics WHERE current_streak_days > 0),
    'students_studied_today', (SELECT COUNT(*) FROM user_statistics WHERE minutes_studied_today > 0),
    'total_study_minutes_today', (SELECT COALESCE(SUM(minutes_studied_today), 0) FROM user_statistics)
  ) INTO student_engagement;

  -- Content usage statistics
  WITH category_sessions AS (
    SELECT 
      c.name_russian as category_name,
      COUNT(us.id) as total_sessions,
      AVG(CASE WHEN us.ended_at IS NOT NULL THEN us.session_accuracy ELSE 0 END) as avg_completion
    FROM user_sessions us
    JOIN categories c ON c.id = us.category_id
    WHERE us.started_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY c.id, c.name_russian
    ORDER BY total_sessions DESC
    LIMIT 5
  )
  SELECT json_build_object(
    'most_studied_categories', (SELECT json_agg(row_to_json(cs)) FROM category_sessions cs),
    'words_learned_today', (SELECT COALESCE(SUM(words_learned_today), 0) FROM user_statistics),
    'categories_completed_today', (SELECT COUNT(*) FROM user_category_progress WHERE completed_at::DATE = CURRENT_DATE)
  ) INTO content_usage;

  -- Combine all analytics
  SELECT json_build_object(
    'platform_stats', platform_stats,
    'student_engagement', student_engagement,
    'content_usage', content_usage
  ) INTO result;

  RETURN result;
END;
$$;

-- Create a new word
CREATE OR REPLACE FUNCTION create_new_word(
  p_category_id INTEGER,
  p_chinese_simplified TEXT,
  p_chinese_traditional TEXT DEFAULT NULL,
  p_pinyin TEXT,
  p_russian_translation TEXT,
  p_english_translation TEXT DEFAULT NULL,
  p_example_sentence_chinese TEXT DEFAULT NULL,
  p_example_sentence_russian TEXT DEFAULT NULL,
  p_audio_url TEXT DEFAULT NULL,
  p_difficulty_level INTEGER DEFAULT 1,
  p_frequency_rank INTEGER DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  new_word_id INTEGER;
BEGIN
  INSERT INTO words (
    category_id,
    chinese_simplified,
    chinese_traditional,
    pinyin,
    russian_translation,
    english_translation,
    example_sentence_chinese,
    example_sentence_russian,
    audio_url,
    difficulty_level,
    frequency_rank,
    is_active
  ) VALUES (
    p_category_id,
    p_chinese_simplified,
    p_chinese_traditional,
    p_pinyin,
    p_russian_translation,
    p_english_translation,
    p_example_sentence_chinese,
    p_example_sentence_russian,
    p_audio_url,
    p_difficulty_level,
    p_frequency_rank,
    p_is_active
  ) RETURNING id INTO new_word_id;

  -- Update category word count
  UPDATE categories 
  SET total_words = (
    SELECT COUNT(*) FROM words WHERE category_id = p_category_id AND is_active = true
  )
  WHERE id = p_category_id;

  RETURN new_word_id;
END;
$$;

-- Update existing word
CREATE OR REPLACE FUNCTION update_existing_word(
  p_word_id INTEGER,
  p_category_id INTEGER,
  p_chinese_simplified TEXT,
  p_chinese_traditional TEXT DEFAULT NULL,
  p_pinyin TEXT,
  p_russian_translation TEXT,
  p_english_translation TEXT DEFAULT NULL,
  p_example_sentence_chinese TEXT DEFAULT NULL,
  p_example_sentence_russian TEXT DEFAULT NULL,
  p_audio_url TEXT DEFAULT NULL,
  p_difficulty_level INTEGER DEFAULT 1,
  p_frequency_rank INTEGER DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  old_category_id INTEGER;
BEGIN
  -- Get old category for count updates
  SELECT category_id INTO old_category_id FROM words WHERE id = p_word_id;

  UPDATE words SET
    category_id = p_category_id,
    chinese_simplified = p_chinese_simplified,
    chinese_traditional = p_chinese_traditional,
    pinyin = p_pinyin,
    russian_translation = p_russian_translation,
    english_translation = p_english_translation,
    example_sentence_chinese = p_example_sentence_chinese,
    example_sentence_russian = p_example_sentence_russian,
    audio_url = p_audio_url,
    difficulty_level = p_difficulty_level,
    frequency_rank = p_frequency_rank,
    is_active = p_is_active,
    updated_at = NOW()
  WHERE id = p_word_id;

  -- Update word counts for affected categories
  IF old_category_id != p_category_id THEN
    UPDATE categories 
    SET total_words = (
      SELECT COUNT(*) FROM words WHERE category_id = old_category_id AND is_active = true
    )
    WHERE id = old_category_id;
  END IF;

  UPDATE categories 
  SET total_words = (
    SELECT COUNT(*) FROM words WHERE category_id = p_category_id AND is_active = true
  )
  WHERE id = p_category_id;

  RETURN TRUE;
END;
$$;

-- Delete word (soft delete by setting is_active = false)
CREATE OR REPLACE FUNCTION delete_word_soft(p_word_id INTEGER)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  word_category_id INTEGER;
BEGIN
  -- Get category id before deletion
  SELECT category_id INTO word_category_id FROM words WHERE id = p_word_id;

  -- Soft delete the word
  UPDATE words SET is_active = false WHERE id = p_word_id;

  -- Update category word count
  UPDATE categories 
  SET total_words = (
    SELECT COUNT(*) FROM words WHERE category_id = word_category_id AND is_active = true
  )
  WHERE id = word_category_id;

  RETURN TRUE;
END;
$$;

-- Create new category
CREATE OR REPLACE FUNCTION create_new_category(
  p_name TEXT,
  p_name_russian TEXT,
  p_description TEXT DEFAULT NULL,
  p_description_russian TEXT DEFAULT NULL,
  p_difficulty_level INTEGER DEFAULT 1,
  p_is_active BOOLEAN DEFAULT TRUE,
  p_display_order INTEGER DEFAULT NULL
)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  new_category_id INTEGER;
  max_order INTEGER;
BEGIN
  -- Get max display order if not provided
  IF p_display_order IS NULL THEN
    SELECT COALESCE(MAX(display_order), 0) + 1 INTO p_display_order FROM categories;
  END IF;

  INSERT INTO categories (
    name,
    name_russian,
    description,
    description_russian,
    difficulty_level,
    is_active,
    display_order,
    total_words
  ) VALUES (
    p_name,
    p_name_russian,
    p_description,
    p_description_russian,
    p_difficulty_level,
    p_is_active,
    p_display_order,
    0
  ) RETURNING id INTO new_category_id;

  RETURN new_category_id;
END;
$$;

-- Update existing category
CREATE OR REPLACE FUNCTION update_existing_category(
  p_category_id INTEGER,
  p_name TEXT,
  p_name_russian TEXT,
  p_description TEXT DEFAULT NULL,
  p_description_russian TEXT DEFAULT NULL,
  p_difficulty_level INTEGER DEFAULT 1,
  p_is_active BOOLEAN DEFAULT TRUE,
  p_display_order INTEGER DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  UPDATE categories SET
    name = p_name,
    name_russian = p_name_russian,
    description = p_description,
    description_russian = p_description_russian,
    difficulty_level = p_difficulty_level,
    is_active = p_is_active,
    display_order = COALESCE(p_display_order, display_order),
    updated_at = NOW()
  WHERE id = p_category_id;

  RETURN TRUE;
END;
$$;

-- Get all categories with word counts
CREATE OR REPLACE FUNCTION get_all_categories_with_counts()
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  name_russian TEXT,
  description TEXT,
  description_russian TEXT,
  difficulty_level INTEGER,
  total_words INTEGER,
  is_active BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.name_russian,
    c.description,
    c.description_russian,
    c.difficulty_level,
    c.total_words,
    c.is_active,
    c.display_order,
    c.created_at,
    c.updated_at
  FROM categories c
  WHERE c.is_active = true
  ORDER BY c.display_order ASC, c.created_at ASC;
END;
$$; 

-- =====================================================
-- TEACHER PANEL SQL FUNCTIONS
-- =====================================================
-- Comprehensive functions for teacher content management
-- =====================================================

-- =====================================================
-- FUNCTION: get_content_with_stats
-- =====================================================
-- Get all words with their usage statistics and category information
CREATE OR REPLACE FUNCTION get_content_with_stats(p_category_filter INTEGER DEFAULT NULL)
RETURNS TABLE (
    id INTEGER,
    category_id INTEGER,
    chinese_simplified VARCHAR(255),
    chinese_traditional VARCHAR(255),
    pinyin VARCHAR(255),
    russian_translation VARCHAR(500),
    english_translation VARCHAR(500),
    example_sentence_chinese TEXT,
    example_sentence_russian TEXT,
    audio_url VARCHAR(500),
    difficulty_level INTEGER,
    frequency_rank INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    category_name VARCHAR(255),
    category_difficulty INTEGER,
    total_learners INTEGER,
    average_accuracy DECIMAL,
    times_studied INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.category_id,
        w.chinese_simplified,
        w.chinese_traditional,
        w.pinyin,
        w.russian_translation,
        w.english_translation,
        w.example_sentence_chinese,
        w.example_sentence_russian,
        w.audio_url,
        w.difficulty_level,
        w.frequency_rank,
        w.is_active,
        w.created_at,
        w.updated_at,
        c.name_russian as category_name,
        c.difficulty_level as category_difficulty,
        COALESCE(stats.total_learners, 0)::INTEGER,
        COALESCE(stats.average_accuracy, 0)::DECIMAL,
        COALESCE(stats.times_studied, 0)::INTEGER
    FROM words w
    LEFT JOIN categories c ON w.category_id = c.id
    LEFT JOIN (
        SELECT 
            word_id,
            COUNT(DISTINCT user_uuid) as total_learners,
            AVG(accuracy_percentage) as average_accuracy,
            COUNT(*) as times_studied
        FROM user_word_progress 
        GROUP BY word_id
    ) stats ON w.id = stats.word_id
    WHERE 
        w.is_active = true
        AND (p_category_filter IS NULL OR w.category_id = p_category_filter)
    ORDER BY w.category_id, w.chinese_simplified;
END;
$$;

-- =====================================================
-- FUNCTION: get_all_students_progress (simple version)
-- =====================================================
-- Get basic student information without complex joins
CREATE OR REPLACE FUNCTION get_all_students_progress()
RETURNS TABLE (
    user_uuid UUID,
    email VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(20)
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.uuid_id,
        u.email,
        u.full_name,
        u.role
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.full_name, u.email;
END;
$$;

-- =====================================================
-- FUNCTION: get_student_detailed_progress
-- =====================================================
-- Get detailed progress for a specific student
CREATE OR REPLACE FUNCTION get_student_detailed_progress(p_student_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
    student_info JSON;
    category_progress JSON;
    recent_sessions JSON;
    word_progress_sample JSON;
BEGIN
    -- Get student basic info
    SELECT to_json(u.*) INTO student_info
    FROM users u
    WHERE u.uuid_id = p_student_uuid;
    
    -- Get category progress
    SELECT json_agg(cp.*) INTO category_progress
    FROM user_category_progress cp
    LEFT JOIN categories c ON cp.category_id = c.id
    WHERE cp.user_uuid = p_student_uuid;
    
    -- Get recent sessions (last 10)
    SELECT json_agg(s.*) INTO recent_sessions
    FROM (
        SELECT * FROM user_sessions
        WHERE user_uuid = p_student_uuid
        ORDER BY started_at DESC
        LIMIT 10
    ) s;
    
    -- Get word progress sample (first 20)
    SELECT json_agg(wp.*) INTO word_progress_sample
    FROM (
        SELECT wp.*, w.chinese_simplified, w.pinyin, w.russian_translation
        FROM user_word_progress wp
        LEFT JOIN words w ON wp.word_id = w.id
        WHERE wp.user_uuid = p_student_uuid
        ORDER BY wp.last_seen_at DESC
        LIMIT 20
    ) wp;
    
    -- Build final result
    SELECT json_build_object(
        'user', student_info,
        'category_progress', COALESCE(category_progress, '[]'::json),
        'recent_sessions', COALESCE(recent_sessions, '[]'::json),
        'word_progress_sample', COALESCE(word_progress_sample, '[]'::json)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_content_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_students_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_detailed_progress TO authenticated; 