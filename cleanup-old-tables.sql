-- =====================================================
-- CLEANUP SCRIPT: REMOVE OLD SYSTEM TABLES
-- =====================================================
-- Run this ONLY after confirming migration was successful
-- This script will safely remove the old questions and user_progress tables
-- =====================================================

-- SAFETY CHECK: Verify migration was successful before running cleanup
-- Uncomment and run these queries first to verify:
-- 
-- SELECT COUNT(*) as migrated_words FROM words;
-- SELECT COUNT(*) as migrated_categories FROM categories;
-- SELECT COUNT(*) as old_questions FROM questions;
-- 
-- Expected results:
-- migrated_words: 50 (19 existing + 31 migrated)
-- migrated_categories: 12 
-- old_questions: 31

BEGIN;

-- Step 1: Add RLS policies to old tables (for safety during transition)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create basic policies for old tables (if needed temporarily)
CREATE POLICY "questions_select_policy" ON questions FOR SELECT USING (true);
CREATE POLICY "user_progress_select_policy" ON user_progress FOR SELECT USING (auth.uid() = user_id);

-- Step 2: Rename old tables instead of dropping (safer approach)
ALTER TABLE questions RENAME TO questions_old_backup;
ALTER TABLE user_progress RENAME TO user_progress_old_backup;

-- Step 3: Create a migration log table for record keeping
CREATE TABLE migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    old_table_name VARCHAR(255),
    new_table_name VARCHAR(255),
    records_migrated INTEGER,
    migration_date TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- Step 4: Log the migration
INSERT INTO migration_log (migration_name, old_table_name, new_table_name, records_migrated, notes) VALUES
('questions_to_words_migration', 'questions', 'words', 31, 'Successfully migrated 31 questions to new advanced system with categories'),
('user_progress_cleanup', 'user_progress', 'user_word_progress', 0, 'Old user_progress table was empty, replaced with advanced tracking system');

COMMIT;

-- =====================================================
-- OPTIONAL: COMPLETE REMOVAL (Run separately if desired)
-- =====================================================
-- 
-- -- Only run this if you're absolutely sure migration was successful
-- -- and you don't need the backup tables anymore
-- 
-- BEGIN;
-- 
-- -- Drop the backup tables completely
-- DROP TABLE IF EXISTS questions_old_backup CASCADE;
-- DROP TABLE IF EXISTS user_progress_old_backup CASCADE;
-- DROP TABLE IF EXISTS questions_archive CASCADE;
-- 
-- -- Update migration log
-- INSERT INTO migration_log (migration_name, notes) VALUES
-- ('cleanup_old_tables', 'Completely removed old backup tables after successful migration verification');
-- 
-- COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to confirm cleanup was successful:
--
-- 1. Check that old tables are renamed/removed:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE '%questions%' OR table_name LIKE '%user_progress%';
--
-- 2. Verify new system is working:
-- SELECT COUNT(*) as total_words FROM words;
-- SELECT COUNT(*) as total_categories FROM categories;
--
-- 3. Check migration log:
-- SELECT * FROM migration_log ORDER BY migration_date DESC; 