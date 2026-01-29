-- ============================================
-- Al-Rizq Data Migration Script
-- Migrates data from old user_backups.logs JSONB to new tables
-- Version: 1.0.0
-- ============================================

-- This script migrates existing data from the old format
-- Run this AFTER 001_create_sync_tables.sql

DO $$
DECLARE
  backup_record RECORD;
  v_user_id UUID;
  v_logs JSONB;
  v_prayer_log JSONB;
  v_fasting_log JSONB;
  v_dzikir_log JSONB;
  v_badge JSONB;
  v_settings JSONB;
BEGIN
  -- Loop through all existing backups
  FOR backup_record IN SELECT * FROM user_backups LOOP
    -- Create or get user
    SELECT get_or_create_user(backup_record.email) INTO v_user_id;
    
    -- Parse the logs column (could be array or object)
    v_logs := backup_record.logs;
    
    -- Check if old format (array) or new format (object)
    IF jsonb_typeof(v_logs) = 'object' THEN
      -- New format: { logs, settings, fastingLogs, dzikirLogs, badges }
      
      -- Migrate Prayer Logs
      IF v_logs ? 'logs' AND jsonb_typeof(v_logs->'logs') = 'array' THEN
        FOR v_prayer_log IN SELECT * FROM jsonb_array_elements(v_logs->'logs') LOOP
          INSERT INTO prayer_logs (
            id, user_id, date, prayer_name, scheduled_time, actual_time,
            status, delay_minutes, reason, is_masbuq, masbuq_rakaat,
            location_type, execution_type, weather_condition,
            has_dzikir, has_qobliyah, has_badiyah, has_dua
          ) VALUES (
            (v_prayer_log->>'id')::UUID,
            v_user_id,
            (v_prayer_log->>'date')::DATE,
            v_prayer_log->>'prayerName',
            v_prayer_log->>'scheduledTime',
            v_prayer_log->>'actualTime',
            v_prayer_log->>'status',
            COALESCE((v_prayer_log->>'delayMinutes')::INTEGER, 0),
            v_prayer_log->>'reason',
            COALESCE((v_prayer_log->>'isMasbuq')::BOOLEAN, FALSE),
            (v_prayer_log->>'masbuqRakaat')::INTEGER,
            v_prayer_log->>'locationType',
            v_prayer_log->>'executionType',
            v_prayer_log->>'weatherCondition',
            COALESCE((v_prayer_log->>'hasDzikir')::BOOLEAN, FALSE),
            COALESCE((v_prayer_log->>'hasQobliyah')::BOOLEAN, FALSE),
            COALESCE((v_prayer_log->>'hasBadiyah')::BOOLEAN, FALSE),
            COALESCE((v_prayer_log->>'hasDua')::BOOLEAN, FALSE)
          )
          ON CONFLICT (user_id, date, prayer_name) DO UPDATE SET
            actual_time = EXCLUDED.actual_time,
            status = EXCLUDED.status,
            delay_minutes = EXCLUDED.delay_minutes;
        END LOOP;
      END IF;
      
      -- Migrate Fasting Logs
      IF v_logs ? 'fastingLogs' AND jsonb_typeof(v_logs->'fastingLogs') = 'array' THEN
        FOR v_fasting_log IN SELECT * FROM jsonb_array_elements(v_logs->'fastingLogs') LOOP
          INSERT INTO fasting_logs (
            id, user_id, date, type, is_completed, notes, is_nadzar, is_qadha
          ) VALUES (
            (v_fasting_log->>'id')::UUID,
            v_user_id,
            (v_fasting_log->>'date')::DATE,
            v_fasting_log->>'type',
            COALESCE((v_fasting_log->>'isCompleted')::BOOLEAN, TRUE),
            v_fasting_log->>'notes',
            COALESCE((v_fasting_log->>'isNadzar')::BOOLEAN, FALSE),
            COALESCE((v_fasting_log->>'isQadha')::BOOLEAN, FALSE)
          )
          ON CONFLICT (user_id, date) DO UPDATE SET
            type = EXCLUDED.type,
            is_nadzar = EXCLUDED.is_nadzar,
            is_qadha = EXCLUDED.is_qadha;
        END LOOP;
      END IF;
      
      -- Migrate Dzikir Logs
      IF v_logs ? 'dzikirLogs' AND jsonb_typeof(v_logs->'dzikirLogs') = 'array' THEN
        FOR v_dzikir_log IN SELECT * FROM jsonb_array_elements(v_logs->'dzikirLogs') LOOP
          INSERT INTO dzikir_logs (
            id, user_id, date, category_id, completed_items, is_completed, timestamp
          ) VALUES (
            (v_dzikir_log->>'id')::UUID,
            v_user_id,
            (v_dzikir_log->>'date')::DATE,
            v_dzikir_log->>'categoryId',
            ARRAY(SELECT jsonb_array_elements_text(v_dzikir_log->'completedItems')),
            COALESCE((v_dzikir_log->>'isCompleted')::BOOLEAN, FALSE),
            (v_dzikir_log->>'timestamp')::BIGINT
          )
          ON CONFLICT (user_id, date, category_id) DO UPDATE SET
            completed_items = EXCLUDED.completed_items,
            is_completed = EXCLUDED.is_completed;
        END LOOP;
      END IF;
      
      -- Migrate Badges
      IF v_logs ? 'badges' AND jsonb_typeof(v_logs->'badges') = 'array' THEN
        FOR v_badge IN SELECT * FROM jsonb_array_elements(v_logs->'badges') LOOP
          INSERT INTO user_badges (
            user_id, badge_id, current_count, unlocked_tier, is_new, unlocked_at
          ) VALUES (
            v_user_id,
            v_badge->>'badgeId',
            COALESCE((v_badge->>'currentCount')::INTEGER, 0),
            v_badge->>'unlockedTier',
            COALESCE((v_badge->>'isNew')::BOOLEAN, FALSE),
            CASE WHEN v_badge->>'unlockedAt' IS NOT NULL 
              THEN to_timestamp((v_badge->>'unlockedAt')::BIGINT / 1000)
              ELSE NULL 
            END
          )
          ON CONFLICT (user_id, badge_id) DO UPDATE SET
            current_count = GREATEST(user_badges.current_count, EXCLUDED.current_count),
            unlocked_tier = CASE 
              WHEN EXCLUDED.unlocked_tier IS NOT NULL THEN EXCLUDED.unlocked_tier 
              ELSE user_badges.unlocked_tier 
            END;
        END LOOP;
      END IF;
      
      -- Migrate Settings
      IF v_logs ? 'settings' AND jsonb_typeof(v_logs->'settings') = 'object' THEN
        v_settings := v_logs->'settings';
        
        INSERT INTO user_settings (
          user_id, theme, language, show_prayer_bg, prayer_bg_opacity,
          location_history, last_known_location,
          correction_global, correction_fajr, correction_dhuhr,
          correction_asr, correction_maghrib, correction_isha,
          gamification_enabled, gamification_points
        ) VALUES (
          v_user_id,
          COALESCE(v_settings->>'theme', 'system'),
          COALESCE(v_settings->>'language', 'id'),
          COALESCE((v_settings->>'showPrayerBg')::BOOLEAN, TRUE),
          COALESCE((v_settings->>'prayerBgOpacity')::REAL, 0.5),
          ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_settings->'locationHistory', '[]'::JSONB))),
          v_settings->>'lastKnownLocation',
          COALESCE((v_settings->'prayerTimeCorrection'->>'global')::INTEGER, 0),
          COALESCE((v_settings->'prayerTimeCorrection'->>'fajr')::INTEGER, 0),
          COALESCE((v_settings->'prayerTimeCorrection'->>'dhuhr')::INTEGER, 0),
          COALESCE((v_settings->'prayerTimeCorrection'->>'asr')::INTEGER, 0),
          COALESCE((v_settings->'prayerTimeCorrection'->>'maghrib')::INTEGER, 0),
          COALESCE((v_settings->'prayerTimeCorrection'->>'isha')::INTEGER, 0),
          COALESCE((v_settings->'gamificationConfig'->>'enabled')::BOOLEAN, TRUE),
          v_settings->'gamificationConfig'->'points'
        )
        ON CONFLICT (user_id) DO UPDATE SET
          theme = EXCLUDED.theme,
          language = EXCLUDED.language,
          show_prayer_bg = EXCLUDED.show_prayer_bg,
          location_history = EXCLUDED.location_history,
          gamification_points = EXCLUDED.gamification_points;
        
        -- Migrate Fasting Configs (Nadzar, Qadha, Ramadhan)
        IF v_settings ? 'nadzarConfig' THEN
          INSERT INTO fasting_configs (user_id, config_type, types, days, custom_dates, start_date, end_date)
          VALUES (
            v_user_id,
            'nadzar',
            ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_settings->'nadzarConfig'->'types', '[]'::JSONB))),
            ARRAY(SELECT (jsonb_array_elements_text(COALESCE(v_settings->'nadzarConfig'->'days', '[]'::JSONB)))::INTEGER),
            ARRAY(SELECT (jsonb_array_elements_text(COALESCE(v_settings->'nadzarConfig'->'customDates', '[]'::JSONB)))::DATE),
            (v_settings->'nadzarConfig'->>'startDate')::DATE,
            (v_settings->'nadzarConfig'->>'endDate')::DATE
          )
          ON CONFLICT (user_id, config_type) DO UPDATE SET
            types = EXCLUDED.types,
            days = EXCLUDED.days,
            custom_dates = EXCLUDED.custom_dates;
        END IF;
        
        IF v_settings ? 'qadhaConfig' THEN
          INSERT INTO fasting_configs (user_id, config_type, types, days, custom_dates, start_date, end_date)
          VALUES (
            v_user_id,
            'qadha',
            ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_settings->'qadhaConfig'->'types', '[]'::JSONB))),
            ARRAY(SELECT (jsonb_array_elements_text(COALESCE(v_settings->'qadhaConfig'->'days', '[]'::JSONB)))::INTEGER),
            ARRAY(SELECT (jsonb_array_elements_text(COALESCE(v_settings->'qadhaConfig'->'customDates', '[]'::JSONB)))::DATE),
            (v_settings->'qadhaConfig'->>'startDate')::DATE,
            (v_settings->'qadhaConfig'->>'endDate')::DATE
          )
          ON CONFLICT (user_id, config_type) DO UPDATE SET
            types = EXCLUDED.types,
            days = EXCLUDED.days;
        END IF;
        
        IF v_settings ? 'ramadhanConfig' THEN
          INSERT INTO fasting_configs (user_id, config_type, start_date, end_date)
          VALUES (
            v_user_id,
            'ramadhan',
            (v_settings->'ramadhanConfig'->>'startDate')::DATE,
            (v_settings->'ramadhanConfig'->>'endDate')::DATE
          )
          ON CONFLICT (user_id, config_type) DO UPDATE SET
            start_date = EXCLUDED.start_date,
            end_date = EXCLUDED.end_date;
        END IF;
      END IF;
      
    ELSIF jsonb_typeof(v_logs) = 'array' THEN
      -- Old format: logs is just an array of prayer logs
      FOR v_prayer_log IN SELECT * FROM jsonb_array_elements(v_logs) LOOP
        INSERT INTO prayer_logs (
          id, user_id, date, prayer_name, scheduled_time, actual_time,
          status, delay_minutes, reason
        ) VALUES (
          (v_prayer_log->>'id')::UUID,
          v_user_id,
          (v_prayer_log->>'date')::DATE,
          v_prayer_log->>'prayerName',
          v_prayer_log->>'scheduledTime',
          v_prayer_log->>'actualTime',
          v_prayer_log->>'status',
          COALESCE((v_prayer_log->>'delayMinutes')::INTEGER, 0),
          v_prayer_log->>'reason'
        )
        ON CONFLICT (user_id, date, prayer_name) DO NOTHING;
      END LOOP;
    END IF;
    
    RAISE NOTICE 'Migrated data for user: %', backup_record.email;
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully!';
END $$;
