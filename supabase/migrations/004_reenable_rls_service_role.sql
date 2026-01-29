-- ============================================
-- Re-enable RLS with Service Role Bypass
-- Run this in Supabase SQL Editor
-- ============================================

-- Re-enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dzikir_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_configs ENABLE ROW LEVEL SECURITY;

-- Create policies that DENY all access via anon key
-- Service role key automatically bypasses RLS

-- Users table policies
CREATE POLICY "Deny anon access to users" ON users
  FOR ALL USING (false);

-- Prayer logs policies  
CREATE POLICY "Deny anon access to prayer_logs" ON prayer_logs
  FOR ALL USING (false);

-- Fasting logs policies
CREATE POLICY "Deny anon access to fasting_logs" ON fasting_logs
  FOR ALL USING (false);

-- Dzikir logs policies
CREATE POLICY "Deny anon access to dzikir_logs" ON dzikir_logs
  FOR ALL USING (false);

-- User badges policies
CREATE POLICY "Deny anon access to user_badges" ON user_badges
  FOR ALL USING (false);

-- User settings policies
CREATE POLICY "Deny anon access to user_settings" ON user_settings
  FOR ALL USING (false);

-- Fasting configs policies
CREATE POLICY "Deny anon access to fasting_configs" ON fasting_configs
  FOR ALL USING (false);
