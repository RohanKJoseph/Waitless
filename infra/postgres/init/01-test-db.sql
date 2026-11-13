-- Runs only when the Postgres data volume is created for the first time.
-- Keeps integration tests off the dev database.
CREATE DATABASE waitless_test OWNER waitless;
