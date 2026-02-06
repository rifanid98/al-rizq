-- ============================================
-- Update RLS Policies for Anon Client
-- Run this in Supabase SQL Editor to allow sync to work without Service Role Key
-- ============================================

-- Drop restrictive policies from migration 004
DROP POLICY IF EXISTS "Deny anon access to users" ON users;
DROP POLICY IF EXISTS "Deny anon access to prayer_logs" ON prayer_logs;
DROP POLICY IF EXISTS "Deny anon access to fasting_logs" ON fasting_logs;
DROP POLICY IF EXISTS "Deny anon access to dzikir_logs" ON dzikir_logs;
DROP POLICY IF EXISTS "Deny anon access to user_badges" ON user_badges;
DROP POLICY IF EXISTS "Deny anon access to user_settings" ON user_settings;
DROP POLICY IF EXISTS "Deny anon access to fasting_configs" ON fasting_configs;

-- Enable public (anon) access based on existing logic
-- IMPORTANT: This app uses direct email identification in syncService.ts
-- For better security, consider implementing Supabase Auth.

CREATE POLICY "Enable anon management for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable anon management for prayer_logs" ON prayer_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable anon management for fasting_logs" ON fasting_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable anon management for dzikir_logs" ON dzikir_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable anon management for user_badges" ON user_badges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable anon management for user_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable anon management for fasting_configs" ON fasting_configs FOR ALL USING (true) WITH CHECK (true);

-- Re-create legacy backups table if it was accidentally removed
CREATE TABLE IF NOT EXISTS user_backups (
    email TEXT PRIMARY KEY,
    logs JSONB,
    last_updated BIGINT
);

-- Also fix for legacy backups table
ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable anon management for user_backups" ON user_backups FOR ALL USING (true) WITH CHECK (true);

-- FORCE SCHEMA RELOAD (Fixes 406 Not Acceptable errors after table recreation)
NOTIFY pgrst, 'reload schema';
