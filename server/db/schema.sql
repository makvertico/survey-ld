-- Lakhpati Didi Income Decline Assessment Survey
-- PostgreSQL 16 — run on your DigitalOcean Droplet:
--   sudo -u postgres psql -d ld_survey -f /path/to/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Survey responses
CREATE TABLE IF NOT EXISTS surveys (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district                 TEXT NOT NULL,
  block                    TEXT,
  gram_panchayat           TEXT,
  village                  TEXT,
  ld_name                  TEXT NOT NULL,
  ld_code                  TEXT,
  shg_name                 TEXT,
  shg_code                 TEXT,
  mobile                   TEXT,
  social_category          TEXT,
  household_size           INT,
  earning_members          INT,
  income_2425              NUMERIC,
  income_2526              NUMERIC,
  -- Computed columns — auto-calculated by the DB, never sent from frontend
  income_decline_amount    NUMERIC GENERATED ALWAYS AS (income_2425 - income_2526) STORED,
  income_decline_pct       NUMERIC GENERATED ALWAYS AS (
                             CASE WHEN income_2425 > 0
                             THEN ROUND(((income_2425 - income_2526) / income_2425) * 100, 2)
                             ELSE 0 END
                           ) STORED,
  income_sources           TEXT[],
  income_sources_other     TEXT,
  highest_decline_source   TEXT,
  decline_reasons          JSONB,
  support_received         TEXT[],
  support_received_other   TEXT,
  support_required         JSONB,
  restoration_possible     TEXT,
  restoration_remarks      TEXT,
  risk_category            TEXT,
  primary_reason           TEXT,
  secondary_reason         TEXT,
  recommended_intervention TEXT,
  enumerator_name          TEXT,
  designation              TEXT,
  survey_date              DATE,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one survey per Lakhpati Didi
ALTER TABLE surveys DROP CONSTRAINT IF EXISTS unique_ld_code;
ALTER TABLE surveys ADD CONSTRAINT unique_ld_code UNIQUE (ld_code);

-- Indexes for fast filtering on admin dashboard
CREATE INDEX IF NOT EXISTS idx_ld_code          ON surveys (ld_code);
CREATE INDEX IF NOT EXISTS idx_district         ON surveys (district);
CREATE INDEX IF NOT EXISTS idx_block            ON surveys (block);
CREATE INDEX IF NOT EXISTS idx_risk_category    ON surveys (risk_category);
CREATE INDEX IF NOT EXISTS idx_survey_date      ON surveys (survey_date DESC);
CREATE INDEX IF NOT EXISTS idx_social_category  ON surveys (social_category);
CREATE INDEX IF NOT EXISTS idx_created_at       ON surveys (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_income_sources   ON surveys USING GIN (income_sources);
CREATE INDEX IF NOT EXISTS idx_decline_reasons  ON surveys USING GIN (decline_reasons);

-- Enumerator accounts (bcrypt hashed passwords)
CREATE TABLE IF NOT EXISTS enumerators (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,        -- bcrypt hash
  designation TEXT,
  district    TEXT,
  role        TEXT DEFAULT 'enumerator',  -- 'enumerator' | 'admin'
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Grant table access to the app user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ld_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ld_user;

-- Seed admin account (do NOT store real passwords in this file — update via psql after deploy)
INSERT INTO enumerators (name, email, password, role)
VALUES ('SMMU Admin', 'smmu@asrlm.org', '$2a$10$6yRnNd4fQJkcbAFlL3h9nuwqpQIxTTvRAGkeBAADwVXokS1Ql0oGG', 'admin')
ON CONFLICT (email) DO NOTHING;
