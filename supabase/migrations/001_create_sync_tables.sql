-- ============================================
-- Al-Rizq Database Migration Script
-- Version: 1.0.0
-- Target: Supabase (PostgreSQL)
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

-- ============================================
-- 2. PRAYER LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prayer_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  prayer_name TEXT NOT NULL CHECK (prayer_name IN ('Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya')),
  scheduled_time TEXT NOT NULL,
  actual_time TEXT,
  status TEXT NOT NULL CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Terlewat')),
  delay_minutes INTEGER DEFAULT 0,
  reason TEXT,
  is_masbuq BOOLEAN DEFAULT FALSE,
  masbuq_rakaat INTEGER,
  location_type TEXT CHECK (location_type IN ('Rumah', 'Masjid') OR location_type IS NULL),
  execution_type TEXT CHECK (execution_type IN ('Jamaah', 'Munfarid') OR execution_type IS NULL),
  weather_condition TEXT CHECK (weather_condition IN ('Cerah', 'Hujan') OR weather_condition IS NULL),
  has_dzikir BOOLEAN DEFAULT FALSE,
  has_qobliyah BOOLEAN DEFAULT FALSE,
  has_badiyah BOOLEAN DEFAULT FALSE,
  has_dua BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date, prayer_name)
);

CREATE INDEX IF NOT EXISTS idx_prayer_logs_user_date ON prayer_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_prayer_logs_date ON prayer_logs(date);

-- RLS for prayer_logs
ALTER TABLE prayer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own prayer logs" ON prayer_logs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

-- ============================================
-- 3. FASTING LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fasting_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Senin-Kamis', 'Ayyamul Bidh', 'Ramadhan', 'Nadzar', 'Qadha', 'Lainnya')),
  is_completed BOOLEAN DEFAULT TRUE,
  notes TEXT,
  is_nadzar BOOLEAN DEFAULT FALSE,
  is_qadha BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_fasting_logs_user_date ON fasting_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_fasting_logs_date ON fasting_logs(date);

-- RLS for fasting_logs
ALTER TABLE fasting_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own fasting logs" ON fasting_logs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

-- ============================================
-- 4. DZIKIR LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dzikir_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category_id TEXT NOT NULL,
  completed_items TEXT[],
  is_completed BOOLEAN DEFAULT FALSE,
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date, category_id)
);

CREATE INDEX IF NOT EXISTS idx_dzikir_logs_user_date ON dzikir_logs(user_id, date);

-- RLS for dzikir_logs
ALTER TABLE dzikir_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dzikir logs" ON dzikir_logs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

-- ============================================
-- 5. USER BADGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  current_count INTEGER DEFAULT 0,
  unlocked_tier TEXT CHECK (unlocked_tier IN ('bronze', 'silver', 'gold', 'diamond') OR unlocked_tier IS NULL),
  is_new BOOLEAN DEFAULT TRUE,
  unlocked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- RLS for user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own badges" ON user_badges
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

-- ============================================
-- 6. USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'id' CHECK (language IN ('id', 'en')),
  show_prayer_bg BOOLEAN DEFAULT TRUE,
  prayer_bg_opacity REAL DEFAULT 0.5,
  location_history TEXT[],
  last_known_location TEXT,
  
  -- Prayer Time Corrections
  correction_global INTEGER DEFAULT 0,
  correction_fajr INTEGER DEFAULT 0,
  correction_dhuhr INTEGER DEFAULT 0,
  correction_asr INTEGER DEFAULT 0,
  correction_maghrib INTEGER DEFAULT 0,
  correction_isha INTEGER DEFAULT 0,
  
  -- Gamification (keep complex nested as JSONB)
  gamification_enabled BOOLEAN DEFAULT TRUE,
  gamification_points JSONB,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

-- ============================================
-- 7. FASTING CONFIGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fasting_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  config_type TEXT NOT NULL CHECK (config_type IN ('nadzar', 'qadha', 'ramadhan')),
  
  -- For Nadzar/Qadha configs
  types TEXT[],
  days INTEGER[],
  custom_dates DATE[],
  start_date DATE,
  end_date DATE,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, config_type)
);

CREATE INDEX IF NOT EXISTS idx_fasting_configs_user ON fasting_configs(user_id);

-- RLS for fasting_configs
ALTER TABLE fasting_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own fasting configs" ON fasting_configs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email'));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_badges_updated_at
  BEFORE UPDATE ON user_badges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fasting_configs_updated_at
  BEFORE UPDATE ON fasting_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- UPSERT HELPER FUNCTION (for sync)
-- ============================================

-- Function to get or create user by email
CREATE OR REPLACE FUNCTION get_or_create_user(p_email TEXT, p_name TEXT DEFAULT NULL, p_picture TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    INSERT INTO users (email, name, picture)
    VALUES (p_email, p_name, p_picture)
    RETURNING id INTO v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
