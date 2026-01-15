-- ============================================
-- 数据库完全重置脚本
-- 警告：此脚本会删除所有数据！
-- ============================================

-- 1️⃣ 删除所有触发器
DROP TRIGGER IF EXISTS check_in_update_streak ON public.check_ins;
DROP TRIGGER IF EXISTS check_in_update_profile_stats ON public.check_ins;
DROP TRIGGER IF EXISTS check_in_update_option_usage ON public.check_ins;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2️⃣ 删除所有函数
DROP FUNCTION IF EXISTS update_streak_on_check_in() CASCADE;
DROP FUNCTION IF EXISTS update_user_profile_stats() CASCADE;
DROP FUNCTION IF EXISTS update_option_usage_count() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 3️⃣ 删除所有表（按依赖关系逆序）
DROP TABLE IF EXISTS public.user_encouragement_history CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.encouragements CASCADE;
DROP TABLE IF EXISTS public.check_ins CASCADE;
DROP TABLE IF EXISTS public.user_habit_options CASCADE;
DROP TABLE IF EXISTS public.user_habits CASCADE;
DROP TABLE IF EXISTS public.habit_options CASCADE;
DROP TABLE IF EXISTS public.habit_categories CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 4️⃣ 删除扩展（如果需要重建）
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- ============================================
-- 确认删除完成
-- ============================================
SELECT 'All tables, functions, and triggers dropped successfully!' as status;
