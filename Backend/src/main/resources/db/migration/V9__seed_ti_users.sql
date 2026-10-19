-- ============================================================
-- V9 — Seed: estrutura para usuários TI (sem senha — gerida pelo DevInitializer)
-- Os usuários são criados/atualizados via DevInitializer.java no startup (profile=dev)
-- ou via TiUserSeeder.java no startup (todos os perfis).
-- Esta migration apenas garante que a estrutura está pronta.
-- ============================================================

-- Garante índice em username (idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);
