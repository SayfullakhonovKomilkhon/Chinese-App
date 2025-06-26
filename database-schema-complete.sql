-- ============================================================================
-- CHINESE LEARNING APPLICATION - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This schema supports advanced learning features including:
-- - Spaced repetition algorithm
-- - Word difficulty tracking (easy/hard/forgot)
-- - Category completion status
-- - Comprehensive progress analytics
-- - User activity logging
-- ============================================================================

-- Drop existing tables and views (if any) - CAREFUL: This deletes all data!
DROP VIEW IF EXISTS user_statistics CASCADE;
DROP TABLE IF EXISTS user_word_progress CASCADE;
DROP TABLE IF EXISTS user_category_progress CASCADE;
DROP TABLE IF EXISTS user_statistics CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS words CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
-- Links to Supabase auth.users via uuid_id
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid_id UUID UNIQUE NOT NULL, -- Links to auth.users.id
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT fk_users_uuid_id FOREIGN KEY (uuid_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_users_uuid_id ON users(uuid_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- 2. CATEGORIES TABLE
-- ============================================================================
-- Learning categories (HSK levels, topics, etc.)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_russian VARCHAR(255) NOT NULL, -- Russian translation
    description TEXT,
    description_russian TEXT, -- Russian description
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 6), -- HSK levels 1-6
    total_words INTEGER DEFAULT 0, -- Auto-calculated
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_difficulty ON categories(difficulty_level);

-- ============================================================================
-- 3. WORDS TABLE
-- ============================================================================
-- Individual words/questions for learning
CREATE TABLE words (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    chinese_simplified VARCHAR(255) NOT NULL,
    chinese_traditional VARCHAR(255),
    pinyin VARCHAR(255) NOT NULL,
    russian_translation VARCHAR(500) NOT NULL,
    english_translation VARCHAR(500),
    example_sentence_chinese TEXT,
    example_sentence_russian TEXT,
    audio_url VARCHAR(500), -- URL to pronunciation audio
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    frequency_rank INTEGER, -- Word frequency ranking
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_words_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_words_category_id ON words(category_id);
CREATE INDEX idx_words_active ON words(is_active);
CREATE INDEX idx_words_difficulty ON words(difficulty_level);

-- ============================================================================
-- 4. USER WORD PROGRESS TABLE
-- ============================================================================
-- Tracks individual word learning progress for each user
CREATE TABLE user_word_progress (
    id SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    word_id INTEGER NOT NULL,
    
    -- Learning status
    learning_status VARCHAR(20) DEFAULT 'new' CHECK (learning_status IN ('new', 'learning', 'learned', 'mastered')),
    
    -- User feedback on difficulty
    last_difficulty VARCHAR(20) CHECK (last_difficulty IN ('easy', 'hard', 'forgot')),
    
    -- Spaced repetition data
    repetition_count INTEGER DEFAULT 0,
    easiness_factor DECIMAL(3,2) DEFAULT 2.5, -- SM-2 algorithm
    interval_days INTEGER DEFAULT 1,
    next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Performance metrics
    correct_answers INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    learned_at TIMESTAMP WITH TIME ZONE,
    mastered_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_user_word_progress_user FOREIGN KEY (user_uuid) REFERENCES users(uuid_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_word_progress_word FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_word UNIQUE (user_uuid, word_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_word_progress_user ON user_word_progress(user_uuid);
CREATE INDEX idx_user_word_progress_word ON user_word_progress(word_id);
CREATE INDEX idx_user_word_progress_status ON user_word_progress(learning_status);
CREATE INDEX idx_user_word_progress_review_date ON user_word_progress(next_review_date);

-- ============================================================================
-- 5. USER CATEGORY PROGRESS TABLE
-- ============================================================================
-- Tracks category completion status for each user
CREATE TABLE user_category_progress (
    id SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    category_id INTEGER NOT NULL,
    
    -- Progress metrics
    total_words INTEGER DEFAULT 0,
    words_started INTEGER DEFAULT 0, -- Words that have been seen
    words_learned INTEGER DEFAULT 0, -- Words marked as learned
    words_mastered INTEGER DEFAULT 0, -- Words marked as mastered
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Category status
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    mastered_at TIMESTAMP WITH TIME ZONE,
    last_studied_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_user_category_progress_user FOREIGN KEY (user_uuid) REFERENCES users(uuid_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_category_progress_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_category UNIQUE (user_uuid, category_id)
);

-- Create indexes
CREATE INDEX idx_user_category_progress_user ON user_category_progress(user_uuid);
CREATE INDEX idx_user_category_progress_category ON user_category_progress(category_id);
CREATE INDEX idx_user_category_progress_status ON user_category_progress(status);

-- ============================================================================
-- 6. USER STATISTICS TABLE
-- ============================================================================
-- Aggregated user statistics for dashboard
CREATE TABLE user_statistics (
    user_uuid UUID PRIMARY KEY,
    
    -- Learning metrics
    total_words_viewed INTEGER DEFAULT 0,
    total_words_learned INTEGER DEFAULT 0,
    total_words_mastered INTEGER DEFAULT 0,
    
    -- Session metrics
    total_sessions INTEGER DEFAULT 0,
    total_study_minutes INTEGER DEFAULT 0,
    average_session_minutes DECIMAL(5,2) DEFAULT 0,
    
    -- Daily tracking
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    total_active_days INTEGER DEFAULT 0,
    words_learned_today INTEGER DEFAULT 0,
    minutes_studied_today INTEGER DEFAULT 0,
    
    -- Performance metrics
    overall_accuracy DECIMAL(5,2) DEFAULT 0,
    categories_completed INTEGER DEFAULT 0,
    categories_mastered INTEGER DEFAULT 0,
    
    -- Timestamps
    last_activity_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_user_statistics_user FOREIGN KEY (user_uuid) REFERENCES users(uuid_id) ON DELETE CASCADE
);

-- ============================================================================
-- 7. USER SESSIONS TABLE
-- ============================================================================
-- Individual study session tracking
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    category_id INTEGER,
    
    -- Session data
    words_studied INTEGER DEFAULT 0,
    words_learned INTEGER DEFAULT 0, -- Words marked as learned in this session
    correct_answers INTEGER DEFAULT 0,
    total_answers INTEGER DEFAULT 0,
    session_accuracy DECIMAL(5,2) DEFAULT 0,
    
    -- Timing
    duration_minutes INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Session type
    session_type VARCHAR(20) DEFAULT 'study' CHECK (session_type IN ('study', 'review', 'test')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_uuid) REFERENCES users(uuid_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_sessions_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_user_sessions_user ON user_sessions(user_uuid);
CREATE INDEX idx_user_sessions_category ON user_sessions(category_id);
CREATE INDEX idx_user_sessions_date ON user_sessions(started_at);

-- ============================================================================
-- 8. USER ACTIVITY TABLE (for detailed tracking)
-- ============================================================================
-- Detailed activity log for analytics
CREATE TABLE user_activity (
    id SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL,
    word_id INTEGER,
    session_id INTEGER,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- 'word_viewed', 'answer_submitted', 'difficulty_rated', etc.
    difficulty_rating VARCHAR(20), -- 'easy', 'hard', 'forgot'
    was_correct BOOLEAN,
    response_time_ms INTEGER, -- Time taken to respond
    
    -- Context
    study_mode VARCHAR(20) DEFAULT 'flashcard', -- 'flashcard', 'multiple_choice', 'typing', etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_user_activity_user FOREIGN KEY (user_uuid) REFERENCES users(uuid_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_activity_word FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE SET NULL,
    CONSTRAINT fk_user_activity_session FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_user_activity_user ON user_activity(user_uuid);
CREATE INDEX idx_user_activity_word ON user_activity(word_id);
CREATE INDEX idx_user_activity_session ON user_activity(session_id);
CREATE INDEX idx_user_activity_date ON user_activity(created_at);

-- ============================================================================
-- 9. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to auto-confirm email for new users
CREATE OR REPLACE FUNCTION auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users 
    SET email_confirmed_at = NOW(),
        email_change_confirm_status = 0
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto email confirmation
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;
CREATE TRIGGER auto_confirm_email_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_confirm_email();

-- Function to update category total_words count
CREATE OR REPLACE FUNCTION update_category_word_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE categories
    SET total_words = (
        SELECT COUNT(*)
        FROM words
        WHERE category_id = COALESCE(NEW.category_id, OLD.category_id)
        AND is_active = true
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.category_id, OLD.category_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for category word count updates
DROP TRIGGER IF EXISTS update_category_word_count_trigger ON words;
CREATE TRIGGER update_category_word_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON words
    FOR EACH ROW
    EXECUTE FUNCTION update_category_word_count();

-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_statistics (user_uuid)
    VALUES (NEW.user_uuid)
    ON CONFLICT (user_uuid) DO NOTHING;
    
    -- Update statistics based on word progress
    UPDATE user_statistics
    SET 
        total_words_viewed = (
            SELECT COUNT(*)
            FROM user_word_progress
            WHERE user_uuid = NEW.user_uuid
        ),
        total_words_learned = (
            SELECT COUNT(*)
            FROM user_word_progress
            WHERE user_uuid = NEW.user_uuid
            AND learning_status IN ('learned', 'mastered')
        ),
        total_words_mastered = (
            SELECT COUNT(*)
            FROM user_word_progress
            WHERE user_uuid = NEW.user_uuid
            AND learning_status = 'mastered'
        ),
        overall_accuracy = (
            SELECT CASE 
                WHEN SUM(total_attempts) > 0 
                THEN (SUM(correct_answers)::DECIMAL / SUM(total_attempts)) * 100
                ELSE 0
            END
            FROM user_word_progress
            WHERE user_uuid = NEW.user_uuid
        ),
        updated_at = NOW()
    WHERE user_uuid = NEW.user_uuid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user statistics updates
DROP TRIGGER IF EXISTS update_user_statistics_trigger ON user_word_progress;
CREATE TRIGGER update_user_statistics_trigger
    AFTER INSERT OR UPDATE ON user_word_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_statistics();

-- Function to update category progress
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

-- Trigger for category progress updates
DROP TRIGGER IF EXISTS update_category_progress_trigger ON user_word_progress;
CREATE TRIGGER update_category_progress_trigger
    AFTER INSERT OR UPDATE ON user_word_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_category_progress();

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_policy ON users FOR ALL USING (auth.uid() = uuid_id);
CREATE POLICY user_word_progress_policy ON user_word_progress FOR ALL USING (auth.uid() = user_uuid);
CREATE POLICY user_category_progress_policy ON user_category_progress FOR ALL USING (auth.uid() = user_uuid);
CREATE POLICY user_statistics_policy ON user_statistics FOR ALL USING (auth.uid() = user_uuid);
CREATE POLICY user_sessions_policy ON user_sessions FOR ALL USING (auth.uid() = user_uuid);
CREATE POLICY user_activity_policy ON user_activity FOR ALL USING (auth.uid() = user_uuid);

-- Categories and words are readable by all authenticated users
CREATE POLICY categories_policy ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY words_policy ON words FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- 11. SAMPLE DATA
-- ============================================================================

-- Insert sample categories
INSERT INTO categories (name, name_russian, description, description_russian, difficulty_level, display_order) VALUES
('HSK 1 - Basic', 'HSK 1 - Базовый', 'Most common 150 words', 'Самые распространенные 150 слов', 1, 1),
('HSK 2 - Elementary', 'HSK 2 - Элементарный', 'Common 300 words', 'Распространенные 300 слов', 2, 2),
('Colors', 'Цвета', 'Basic colors in Chinese', 'Основные цвета на китайском', 1, 3),
('Family', 'Семья', 'Family members', 'Члены семьи', 1, 4),
('Numbers', 'Числа', 'Numbers 1-100', 'Числа от 1 до 100', 1, 5);

-- Insert sample words
INSERT INTO words (category_id, chinese_simplified, chinese_traditional, pinyin, russian_translation, english_translation, difficulty_level) VALUES
-- HSK 1 words
(1, '你好', '你好', 'nǐ hǎo', 'привет', 'hello', 1),
(1, '我', '我', 'wǒ', 'я', 'I/me', 1),
(1, '你', '你', 'nǐ', 'ты', 'you', 1),
(1, '他', '他', 'tā', 'он', 'he/him', 1),
(1, '她', '她', 'tā', 'она', 'she/her', 1),

-- Colors
(3, '红色', '紅色', 'hóng sè', 'красный', 'red', 1),
(3, '蓝色', '藍色', 'lán sè', 'синий', 'blue', 1),
(3, '绿色', '綠色', 'lǜ sè', 'зеленый', 'green', 1),
(3, '黄色', '黃色', 'huáng sè', 'желтый', 'yellow', 1),
(3, '白色', '白色', 'bái sè', 'белый', 'white', 1),

-- Family
(4, '爸爸', '爸爸', 'bà ba', 'папа', 'father', 1),
(4, '妈妈', '媽媽', 'mā ma', 'мама', 'mother', 1),
(4, '儿子', '兒子', 'ér zi', 'сын', 'son', 1),
(4, '女儿', '女兒', 'nǚ ér', 'дочь', 'daughter', 1),

-- Numbers
(5, '一', '一', 'yī', 'один', 'one', 1),
(5, '二', '二', 'èr', 'два', 'two', 1),
(5, '三', '三', 'sān', 'три', 'three', 1),
(5, '四', '四', 'sì', 'четыре', 'four', 1),
(5, '五', '五', 'wǔ', 'пять', 'five', 1);

-- Update category word counts
UPDATE categories SET total_words = (
    SELECT COUNT(*) FROM words WHERE category_id = categories.id AND is_active = true
);

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- This schema provides:
-- ✅ Comprehensive user progress tracking
-- ✅ Spaced repetition algorithm support
-- ✅ Word difficulty feedback (easy/hard/forgot)
-- ✅ Category completion tracking
-- ✅ Detailed analytics and statistics
-- ✅ Row Level Security for data isolation
-- ✅ Automatic triggers for data consistency
-- ============================================================================ 