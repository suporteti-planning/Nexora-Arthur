-- ============================================================
-- V6 — Catálogo DOC v2: melhorias de schema
-- Adiciona requires_email_address nas etapas e
-- tabela process_stage_rules para orientações de equipes.
-- Idempotente — usa ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- Adiciona flag de etapa de email livre (se já não existir)
ALTER TABLE doc_steps
    ADD COLUMN IF NOT EXISTS requires_email_address BOOLEAN NOT NULL DEFAULT FALSE;

-- Adiciona campo de email de destino nos detalhes do chamado DOC
ALTER TABLE doc_ticket_details
    ADD COLUMN IF NOT EXISTS email_destination VARCHAR(255),
    ADD COLUMN IF NOT EXISTS description_text TEXT;

-- Tabela de regras/orientações por etapa (equipes a informar, etc.)
CREATE TABLE IF NOT EXISTS process_stage_rules (
    id                  BIGSERIAL PRIMARY KEY,
    step_id             BIGINT      NOT NULL REFERENCES doc_steps(id) ON DELETE CASCADE,
    rule_type           VARCHAR(50) NOT NULL DEFAULT 'NOTIFY_TEAM',
    instruction         TEXT        NOT NULL,
    active              BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stage_rules_step ON process_stage_rules(step_id);
