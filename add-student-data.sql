-- =====================================================
-- AUTH FIX: RLS POLICIES FOR ROLE FETCHING AND TEACHER ACCESS
-- =====================================================
-- This script fixes the authentication issue where users
-- can't access their role after login due to restrictive RLS policies
-- =====================================================

-- STEP 1: Disable RLS temporarily to avoid conflicts during policy changes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics DISABLE ROW LEVEL SECURITY;

-- STEP 2: Clean up all existing conflicting policies
DROP POLICY IF EXISTS users_policy ON users;
DROP POLICY IF EXISTS user_statistics_policy ON user_statistics;
DROP POLICY IF EXISTS users_access_policy ON users;
DROP POLICY IF EXISTS user_statistics_access_policy ON user_statistics;
DROP POLICY IF EXISTS admin_full_access_users ON users;
DROP POLICY IF EXISTS users_own_data ON users;
DROP POLICY IF EXISTS admin_full_access_stats ON user_statistics;
DROP POLICY IF EXISTS users_own_stats ON user_statistics;

-- STEP 3: Ensure current teacher user has admin role
UPDATE users 
SET role = 'admin' 
WHERE email = (
  SELECT email FROM auth.users 
  WHERE id = auth.uid()
) 
AND role != 'admin';

-- STEP 4: Clear and add test data
DELETE FROM user_statistics WHERE user_uuid IN (
  SELECT uuid_id FROM users WHERE email LIKE '%@example.com'
);
DELETE FROM users WHERE email LIKE '%@example.com';

INSERT INTO users (uuid_id, email, full_name, role, created_at) VALUES
(gen_random_uuid(), 'student1@example.com', 'Li Wei', 'student', NOW() - INTERVAL '5 days'),
(gen_random_uuid(), 'student2@example.com', 'Wang Mei', 'student', NOW() - INTERVAL '3 days'),
(gen_random_uuid(), 'student3@example.com', 'Zhang Ming', 'student', NOW() - INTERVAL '7 days'),
(gen_random_uuid(), 'student4@example.com', 'Chen Lei', 'student', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'student5@example.com', 'Liu Hua', 'student', NOW() - INTERVAL '2 days');

-- STEP 5: Re-enable RLS and create proper policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create comprehensive policies that allow:
-- 1. All authenticated users to read their own data (for role fetching)
-- 2. Admin users to read all data (for teacher panel)
-- 3. Student users to only see their own data

-- Policy 1: Users can ALWAYS read their own profile (essential for role fetching)
CREATE POLICY "users_read_own_profile" ON users 
FOR SELECT 
TO authenticated 
USING (uuid_id = auth.uid());

-- Policy 2: Users can update their own profile
CREATE POLICY "users_update_own_profile" ON users 
FOR UPDATE 
TO authenticated 
USING (uuid_id = auth.uid())
WITH CHECK (uuid_id = auth.uid());

-- Policy 3: Admin users can read ALL user data (for teacher panel)
CREATE POLICY "admin_read_all_users" ON users 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users admin_check 
    WHERE admin_check.uuid_id = auth.uid() 
    AND admin_check.role IN ('admin', 'teacher')
  )
);

-- Policy 4: Admin users can update all user data
CREATE POLICY "admin_update_all_users" ON users 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users admin_check 
    WHERE admin_check.uuid_id = auth.uid() 
    AND admin_check.role IN ('admin', 'teacher')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users admin_check 
    WHERE admin_check.uuid_id = auth.uid() 
    AND admin_check.role IN ('admin', 'teacher')
  )
);

-- Policy 5: Allow new user creation (for registration)
CREATE POLICY "allow_user_creation" ON users 
FOR INSERT 
TO authenticated 
WITH CHECK (uuid_id = auth.uid());

-- STEP 7: Similar policies for user_statistics
CREATE POLICY "users_read_own_stats" ON user_statistics 
FOR SELECT 
TO authenticated 
USING (user_uuid = auth.uid());

CREATE POLICY "users_modify_own_stats" ON user_statistics 
FOR ALL 
TO authenticated 
USING (user_uuid = auth.uid())
WITH CHECK (user_uuid = auth.uid());

CREATE POLICY "admin_read_all_stats" ON user_statistics 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users admin_check 
    WHERE admin_check.uuid_id = auth.uid() 
    AND admin_check.role IN ('admin', 'teacher')
  )
);

-- STEP 8: Grant essential permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_statistics TO authenticated;

-- STEP 9: Create bypass function for emergency access (can be removed later)
CREATE OR REPLACE FUNCTION get_user_role_bypass(user_uuid UUID)
RETURNS VARCHAR
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE uuid_id = user_uuid LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- STEP 10: Verification queries
SELECT 'Current user info:' as info;
SELECT 
  u.email,
  u.role,
  u.uuid_id = auth.uid() as is_current_user,
  'Auth access working: ' || CASE WHEN u.role IN ('admin', 'teacher') THEN 'YES' ELSE 'STUDENT_ONLY' END as access_level
FROM users u 
WHERE u.uuid_id = auth.uid();

SELECT 'Students available:' as info;
SELECT COUNT(*) as student_count
FROM users 
WHERE role = 'student';

-- Test admin access to student data
SELECT 'Admin can see students:' as info;
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'YES - ' || COUNT(*) || ' students visible'
    ELSE 'NO - Access blocked'
  END as admin_access_test
FROM users 
WHERE role = 'student';

-- =====================================================
-- TEST DATA FOR TEACHER PANEL CONTENT MANAGEMENT
-- =====================================================
-- Add test categories and words to verify CRUD functionality
-- =====================================================

-- First, ensure we have an admin user for testing
DO $$
BEGIN
  -- Create test admin user if not exists
  INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@test.com',
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Create admin user profile
  INSERT INTO users (uuid_id, email, full_name, role)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@test.com',
    'Test Admin',
    'admin'
  ) ON CONFLICT (uuid_id) DO UPDATE SET 
    role = 'admin',
    full_name = 'Test Admin';
END $$;

-- =====================================================
-- ADD TEST CATEGORIES
-- =====================================================
INSERT INTO categories (name, name_russian, description, description_russian, difficulty_level, display_order, is_active) VALUES
('HSK1 Basic', 'HSK 1 - Базовый', 'Basic Chinese words for beginners', 'Базовые китайские слова для начинающих', 1, 1, true),
('HSK1 Family', 'HSK 1 - Семья', 'Family members and relationships', 'Члены семьи и родственные отношения', 1, 2, true),
('HSK2 Time', 'HSK 2 - Время', 'Time expressions and calendar', 'Выражения времени и календарь', 2, 3, true),
('HSK2 Food', 'HSK 2 - Еда', 'Food and dining vocabulary', 'Словарь еды и обеда', 2, 4, true),
('HSK3 Travel', 'HSK 3 - Путешествия', 'Travel and transportation', 'Путешествия и транспорт', 3, 5, true)
ON CONFLICT (name) DO UPDATE SET
  name_russian = EXCLUDED.name_russian,
  description = EXCLUDED.description,
  description_russian = EXCLUDED.description_russian,
  difficulty_level = EXCLUDED.difficulty_level,
  display_order = EXCLUDED.display_order;

-- =====================================================
-- ADD TEST WORDS
-- =====================================================

-- HSK1 Basic words
INSERT INTO words (category_id, chinese_simplified, chinese_traditional, pinyin, russian_translation, english_translation, difficulty_level, is_active) VALUES
((SELECT id FROM categories WHERE name = 'HSK1 Basic'), '你好', '你好', 'nǐ hǎo', 'привет', 'hello', 1, true),
((SELECT id FROM categories WHERE name = 'HSK1 Basic'), '我', '我', 'wǒ', 'я', 'I/me', 1, true),
((SELECT id FROM categories WHERE name = 'HSK1 Basic'), '你', '你', 'nǐ', 'ты', 'you', 1, true),
((SELECT id FROM categories WHERE name = 'HSK1 Basic'), '是', '是', 'shì', 'быть/являться', 'to be', 1, true),
((SELECT id FROM categories WHERE name = 'HSK1 Basic'), '的', '的', 'de', 'частица притяжения', 'possessive particle', 1, true)
ON CONFLICT DO NOTHING;

-- HSK1 Family words
INSERT INTO words (category_id, chinese_simplified, chinese_traditional, pinyin, russian_translation, english_translation, difficulty_level, is_active) VALUES
((SELECT id FROM categories WHERE name = 'HSK1 Family'), '妈妈', '媽媽', 'mā ma', 'мама', 'mother', 1, true),
((SELECT id FROM categories WHERE name = 'HSK1 Family'), '爸爸', '爸爸', 'bà ba', 'папа', 'father', 1, true),
((SELECT id FROM categories WHERE name = 'HSK1 Family'), '儿子', '兒子', 'ér zi', 'сын', 'son', 1, true),
((SELECT id FROM categories WHERE name = 'HSK1 Family'), '女儿', '女兒', 'nǚ ér', 'дочь', 'daughter', 1, true)
ON CONFLICT DO NOTHING;

-- HSK2 Time words
INSERT INTO words (category_id, chinese_simplified, chinese_traditional, pinyin, russian_translation, english_translation, difficulty_level, is_active) VALUES
((SELECT id FROM categories WHERE name = 'HSK2 Time'), '现在', '現在', 'xiàn zài', 'сейчас', 'now', 2, true),
((SELECT id FROM categories WHERE name = 'HSK2 Time'), '今天', '今天', 'jīn tiān', 'сегодня', 'today', 2, true),
((SELECT id FROM categories WHERE name = 'HSK2 Time'), '明天', '明天', 'míng tiān', 'завтра', 'tomorrow', 2, true),
((SELECT id FROM categories WHERE name = 'HSK2 Time'), '昨天', '昨天', 'zuó tiān', 'вчера', 'yesterday', 2, true)
ON CONFLICT DO NOTHING;

-- HSK2 Food words
INSERT INTO words (category_id, chinese_simplified, chinese_traditional, pinyin, russian_translation, english_translation, difficulty_level, is_active) VALUES
((SELECT id FROM categories WHERE name = 'HSK2 Food'), '吃', '吃', 'chī', 'есть', 'to eat', 2, true),
((SELECT id FROM categories WHERE name = 'HSK2 Food'), '米饭', '米飯', 'mǐ fàn', 'рис', 'rice', 2, true),
((SELECT id FROM categories WHERE name = 'HSK2 Food'), '面条', '麵條', 'miàn tiáo', 'лапша', 'noodles', 2, true),
((SELECT id FROM categories WHERE name = 'HSK2 Food'), '水', '水', 'shuǐ', 'вода', 'water', 2, true)
ON CONFLICT DO NOTHING;

-- HSK3 Travel words
INSERT INTO words (category_id, chinese_simplified, chinese_traditional, pinyin, russian_translation, english_translation, difficulty_level, is_active) VALUES
((SELECT id FROM categories WHERE name = 'HSK3 Travel'), '飞机', '飛機', 'fēi jī', 'самолет', 'airplane', 3, true),
((SELECT id FROM categories WHERE name = 'HSK3 Travel'), '火车', '火車', 'huǒ chē', 'поезд', 'train', 3, true),
((SELECT id FROM categories WHERE name = 'HSK3 Travel'), '汽车', '汽車', 'qì chē', 'автомобиль', 'car', 3, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ADD TEST STUDENTS
-- =====================================================
DO $$
BEGIN
  -- Add test student 1
  INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
  VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'student1@test.com',
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO users (uuid_id, email, full_name, role)
  VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'student1@test.com',
    'Анна Иванова',
    'student'
  ) ON CONFLICT (uuid_id) DO UPDATE SET 
    full_name = 'Анна Иванова';

  -- Add test student 2
  INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
  VALUES (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'student2@test.com',
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO users (uuid_id, email, full_name, role)
  VALUES (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'student2@test.com',
    'Дмитрий Петров',
    'student'
  ) ON CONFLICT (uuid_id) DO UPDATE SET 
    full_name = 'Дмитрий Петров';

  -- Add test student 3
  INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
  VALUES (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'student3@test.com',
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO users (uuid_id, email, full_name, role)
  VALUES (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'student3@test.com',
    'Мария Сидорова',
    'student'
  ) ON CONFLICT (uuid_id) DO UPDATE SET 
    full_name = 'Мария Сидорова';
    
END $$;

-- Update category word counts
UPDATE categories SET total_words = (
  SELECT COUNT(*) FROM words WHERE words.category_id = categories.id AND words.is_active = true
);

SELECT 'Test data added successfully!' as message; 