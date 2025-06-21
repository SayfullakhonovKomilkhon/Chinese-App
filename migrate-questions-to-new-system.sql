-- =====================================================
-- MIGRATION SCRIPT: OLD QUESTIONS TO NEW SYSTEM
-- =====================================================
-- This script migrates data from the old 'questions' table 
-- to the new advanced learning system with categories and words
-- =====================================================

BEGIN;

-- Step 1: Insert Categories (with Russian names and difficulty levels)
INSERT INTO categories (name, name_russian, description_russian, difficulty_level, display_order, total_words) VALUES
('Basic Phrases', 'Базовые фразы', 'Основные фразы для ежедневного общения', 1, 1, 2),
('Travel Chinese', 'Китайский для путешествий', 'Полезные фразы для путешествий и туризма', 2, 2, 9),
('Food and Drinks', 'Еда и напитки', 'Словарь продуктов питания и напитков', 2, 3, 3),
('Animals', 'Животные', 'Названия животных на китайском языке', 1, 4, 4),
('Places', 'Места', 'Названия мест и зданий', 3, 5, 5),
('Clothing', 'Одежда', 'Предметы одежды и аксессуары', 2, 6, 3),
('HSK Level 2', 'HSK 2', 'Слова из второго уровня HSK', 3, 7, 5);

-- Step 2: Insert Words with proper category mapping
-- Basic Phrases (Базовые фразы)
INSERT INTO words (category_id, chinese_simplified, pinyin, russian_translation, difficulty_level, frequency_rank) VALUES
((SELECT id FROM categories WHERE name = 'Basic Phrases'), '你好嗎？', 'nǐ hǎo ma?', 'Как дела?', 1, 50),
((SELECT id FROM categories WHERE name = 'Basic Phrases'), '请', 'qǐng', 'Пожалуйста', 1, 30);

-- Travel Chinese (Китайский для путешествий)
INSERT INTO words (category_id, chinese_simplified, pinyin, russian_translation, difficulty_level, frequency_rank) VALUES
((SELECT id FROM categories WHERE name = 'Travel Chinese'), '你好', 'nǐ hǎo', 'Привет', 1, 10),
((SELECT id FROM categories WHERE name = 'Travel Chinese'), '谢谢', 'xièxiè', 'Спасибо', 1, 20),
((SELECT id FROM categories WHERE name = 'Travel Chinese'), '再见', 'zàijiàn', 'До свидания', 1, 25),
((SELECT id FROM categories WHERE name = 'Travel Chinese'), '是', 'shì', 'Да', 1, 5),
((SELECT id FROM categories WHERE name = 'Travel Chinese'), '不是', 'bù shì', 'Нет', 1, 15),
((SELECT id FROM categories WHERE name = 'Travel Chinese'), '请问', 'qǐng wèn', 'Извините, можно спросить', 2, 100),
((SELECT id FROM categories WHERE name = 'Travel Chinese'), '我不懂', 'wǒ bù dǒng', 'Я не понимаю', 2, 80),
((SELECT id FROM categories WHERE name = 'Travel Chinese'), '多少钱？', 'duō shǎo qián?', 'Сколько стоит?', 2, 90),
((SELECT id FROM categories WHERE name = 'Travel Chinese'), '厕所在哪里？', 'cè suǒ zài nǎ lǐ?', 'Где находится туалет?', 2, 150);

-- Food and Drinks (Еда и напитки)
INSERT INTO words (category_id, chinese_simplified, pinyin, russian_translation, difficulty_level, frequency_rank) VALUES
((SELECT id FROM categories WHERE name = 'Food and Drinks'), '水', 'shuǐ', 'Вода', 1, 40),
((SELECT id FROM categories WHERE name = 'Food and Drinks'), '米饭', 'mǐ fàn', 'Рис', 2, 60),
((SELECT id FROM categories WHERE name = 'Food and Drinks'), '面条', 'miàn tiáo', 'Лапша', 2, 70);

-- Animals (Животные)
INSERT INTO words (category_id, chinese_simplified, pinyin, russian_translation, difficulty_level, frequency_rank) VALUES
((SELECT id FROM categories WHERE name = 'Animals'), '猫', 'māo', 'Кошка', 1, 120),
((SELECT id FROM categories WHERE name = 'Animals'), '狗', 'gǒu', 'Собака', 1, 110),
((SELECT id FROM categories WHERE name = 'Animals'), '鸟', 'niǎo', 'Птица', 2, 130),
((SELECT id FROM categories WHERE name = 'Animals'), '鱼', 'yú', 'Рыба', 1, 85);

-- Places (Места)
INSERT INTO words (category_id, chinese_simplified, pinyin, russian_translation, difficulty_level, frequency_rank) VALUES
((SELECT id FROM categories WHERE name = 'Places'), '学校', 'xué xiào', 'Школа', 2, 200),
((SELECT id FROM categories WHERE name = 'Places'), '医院', 'yī yuàn', 'Больница', 3, 250),
((SELECT id FROM categories WHERE name = 'Places'), '商店', 'shāng diàn', 'Магазин', 2, 180),
((SELECT id FROM categories WHERE name = 'Places'), '图书馆', 'tú shū guǎn', 'Библиотека', 3, 300),
((SELECT id FROM categories WHERE name = 'Places'), '饭店', 'fàn diàn', 'Ресторан', 2, 220);

-- Clothing (Одежда)
INSERT INTO words (category_id, chinese_simplified, pinyin, russian_translation, difficulty_level, frequency_rank) VALUES
((SELECT id FROM categories WHERE name = 'Clothing'), '衣服', 'yī fu', 'Одежда', 2, 160),
((SELECT id FROM categories WHERE name = 'Clothing'), '鞋子', 'xié zi', 'Обувь', 2, 170),
((SELECT id FROM categories WHERE name = 'Clothing'), '帽子', 'mào zi', 'Шапка', 2, 190);

-- HSK Level 2 (HSK 2)
INSERT INTO words (category_id, chinese_simplified, pinyin, russian_translation, difficulty_level, frequency_rank) VALUES
((SELECT id FROM categories WHERE name = 'HSK Level 2'), '今天', 'jīn tiān', 'Сегодня', 2, 35),
((SELECT id FROM categories WHERE name = 'HSK Level 2'), '明天', 'míng tiān', 'Завтра', 2, 45),
((SELECT id FROM categories WHERE name = 'HSK Level 2'), '昨天', 'zuó tiān', 'Вчера', 2, 55),
((SELECT id FROM categories WHERE name = 'HSK Level 2'), '现在', 'xiàn zài', 'Сейчас', 2, 25),
((SELECT id FROM categories WHERE name = 'HSK Level 2'), '晚上', 'wǎn shàng', 'Вечер', 2, 65);

-- Step 3: Update category total_words counts based on actual inserted words
UPDATE categories SET total_words = (
    SELECT COUNT(*) FROM words WHERE words.category_id = categories.id
);

-- Step 4: Create a backup/archive table for old questions (optional)
CREATE TABLE IF NOT EXISTS questions_archive AS 
SELECT *, now() as archived_at FROM questions;

-- Step 5: Verification queries (run these after migration)
-- SELECT 'Migration Summary' as info;
-- SELECT 
--     c.name_russian as category,
--     c.total_words as expected_count,
--     COUNT(w.id) as actual_count,
--     c.difficulty_level
-- FROM categories c
-- LEFT JOIN words w ON c.id = w.category_id
-- GROUP BY c.id, c.name_russian, c.total_words, c.difficulty_level
-- ORDER BY c.display_order;

-- SELECT 'Total Words Migrated' as info, COUNT(*) as count FROM words;
-- SELECT 'Total Categories Created' as info, COUNT(*) as count FROM categories;

COMMIT;

-- =====================================================
-- POST-MIGRATION CLEANUP (Run separately after verification)
-- =====================================================
-- 
-- -- Drop old tables after confirming migration success
-- -- DROP TABLE IF EXISTS user_progress CASCADE;
-- -- DROP TABLE IF EXISTS questions CASCADE;
-- 
-- -- Or rename them for safety
-- -- ALTER TABLE questions RENAME TO questions_old_backup;
-- -- ALTER TABLE user_progress RENAME TO user_progress_old_backup;
-- 
-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries after migration to verify success:
--
-- 1. Check category distribution:
-- SELECT 
--     c.name_russian as "Категория",
--     c.total_words as "Ожидаемо слов",
--     COUNT(w.id) as "Фактически слов",
--     c.difficulty_level as "Уровень сложности"
-- FROM categories c
-- LEFT JOIN words w ON c.id = w.category_id
-- GROUP BY c.id, c.name_russian, c.total_words, c.difficulty_level
-- ORDER BY c.display_order;
--
-- 2. Sample words from each category:
-- SELECT 
--     c.name_russian as category,
--     w.chinese_simplified,
--     w.pinyin,
--     w.russian_translation
-- FROM categories c
-- JOIN words w ON c.id = w.category_id
-- ORDER BY c.display_order, w.frequency_rank
-- LIMIT 10;
--
-- 3. Check for any missing data:
-- SELECT COUNT(*) as total_words_migrated FROM words;
-- SELECT COUNT(*) as total_categories_created FROM categories; 