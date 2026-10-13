-- ============================================================
-- V1 — Baseline: registra o schema existente no Flyway
-- Não altera nenhuma tabela existente.
-- O Flyway baseline-on-migrate=true + baseline-version=0
-- garante que este script só é executado em bancos novos.
-- Em bancos existentes a baseline já foi marcada na versão 0.
-- ============================================================

-- Tabelas já existentes (criadas pelo ddl-auto=update anterior):
--   users, employees, employee_microsoft_licenses,
--   notebooks, event_store
-- Este arquivo serve apenas como documentação do estado inicial.
SELECT 1;
