-- ============================================
-- Fix RLS Policies for Non-Supabase Auth
-- Run this in Supabase SQL Editor
-- ============================================

-- Option A: Disable RLS completely (for personal/trusted app)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE dzikir_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_configs DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that cause issues
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can manage own prayer logs" ON prayer_logs;
DROP POLICY IF EXISTS "Users can manage own fasting logs" ON fasting_logs;
DROP POLICY IF EXISTS "Users can manage own dzikir logs" ON dzikir_logs;
DROP POLICY IF EXISTS "Users can manage own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can manage own fasting configs" ON fasting_configs;
