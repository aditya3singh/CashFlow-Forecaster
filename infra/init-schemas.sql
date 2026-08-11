-- =============================================
-- CashFlow Forecaster — Database Schema Init
-- =============================================
-- Creates 7 separate schemas (one per module).
-- Each module owns its tables within its schema.
-- No foreign keys across schema boundaries.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS bank;
CREATE SCHEMA IF NOT EXISTS txn;
CREATE SCHEMA IF NOT EXISTS forecast;
CREATE SCHEMA IF NOT EXISTS alert;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS admin;

-- Grant usage to the default user
GRANT ALL ON SCHEMA auth TO cashflow;
GRANT ALL ON SCHEMA bank TO cashflow;
GRANT ALL ON SCHEMA txn TO cashflow;
GRANT ALL ON SCHEMA forecast TO cashflow;
GRANT ALL ON SCHEMA alert TO cashflow;
GRANT ALL ON SCHEMA audit TO cashflow;
GRANT ALL ON SCHEMA admin TO cashflow;
