-- ============================================================
-- V2 — RBAC: equipes e permissões de usuários
-- ============================================================

-- Garante CPF nullable (caso a migração manual não tenha rodado)
ALTER TABLE employees ALTER COLUMN cpf DROP NOT NULL;

-- Adiciona coluna team_role no users (pode já existir em bancos novos)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS team_role VARCHAR(50) DEFAULT 'COLABORADOR',
    ADD COLUMN IF NOT EXISTS department VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_team_member BOOLEAN DEFAULT FALSE NOT NULL;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_users_team_role ON users(team_role);
CREATE INDEX IF NOT EXISTS idx_users_active    ON users(active);
