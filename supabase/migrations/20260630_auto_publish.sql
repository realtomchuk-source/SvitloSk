-- ============================================
-- Міграція: Автоматична публікація графіків
-- Дата: 2026-06-30
-- Виконати в Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Додати нові стовпці до parser_results
ALTER TABLE parser_results 
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 2. Заповнити received_at для існуючих записів (= created_at)
UPDATE parser_results 
  SET received_at = created_at 
  WHERE received_at IS NULL;

-- 3. Для вже затверджених — published_at = created_at
UPDATE parser_results 
  SET published_at = created_at 
  WHERE status = 'approved' AND published_at IS NULL;

-- 4. Перевести всі pending записи в auto_approved
UPDATE parser_results 
  SET status = 'auto_approved' 
  WHERE status = 'pending';

-- 5. Перевірка результатів
SELECT id, target_date, status, received_at, published_at, created_at 
FROM parser_results 
ORDER BY created_at DESC 
LIMIT 10;
