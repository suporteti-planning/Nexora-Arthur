-- ============================================================
-- V8 — Monitores e Cofre de Senhas
-- Não altera tabelas existentes (notebooks, employees, etc.)
-- ============================================================

-- ── Monitores ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monitors (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    brand         VARCHAR(255) NOT NULL,
    model         VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) NOT NULL UNIQUE,
    cost_center   VARCHAR(50)  NOT NULL,
    status        VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    price         DOUBLE PRECISION,
    observations  TEXT,
    employee_id   BIGINT REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_monitors_employee ON monitors(employee_id);
CREATE INDEX IF NOT EXISTS idx_monitors_status   ON monitors(status);

-- ── Coluna microsoft_id em employees (idempotente) ────────────────────────
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS microsoft_id VARCHAR(255) UNIQUE;

-- ── Cofre de senhas ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_vault_entries (
    id                 BIGSERIAL PRIMARY KEY,
    title              VARCHAR(255) NOT NULL,
    username           VARCHAR(255) NOT NULL,
    encrypted_password TEXT         NOT NULL,
    url                TEXT,
    category           VARCHAR(100) NOT NULL,
    description        TEXT,
    visibility         VARCHAR(20)  NOT NULL DEFAULT 'PRIVATE',
    owner_username     VARCHAR(255) NOT NULL,
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_vault_viewers (
    entry_id         BIGINT      NOT NULL REFERENCES password_vault_entries(id) ON DELETE CASCADE,
    viewer_username  VARCHAR(255) NOT NULL,
    PRIMARY KEY (entry_id, viewer_username)
);

CREATE INDEX IF NOT EXISTS idx_vault_owner  ON password_vault_entries(owner_username);
CREATE INDEX IF NOT EXISTS idx_vault_viewers ON password_vault_viewers(entry_id);
