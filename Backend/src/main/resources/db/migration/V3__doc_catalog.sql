-- ============================================================
-- V3 — Catálogo DOC: processos e etapas
-- ============================================================

CREATE TABLE IF NOT EXISTS doc_processes (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(30)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order  INT          NOT NULL DEFAULT 0,
    active      BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS doc_steps (
    id          BIGSERIAL PRIMARY KEY,
    process_id  BIGINT       NOT NULL REFERENCES doc_processes(id) ON DELETE CASCADE,
    code        VARCHAR(30)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    inform_text TEXT,          -- conteúdo da coluna "Informar" da planilha
    requires_company   BOOLEAN NOT NULL DEFAULT FALSE,
    requires_documents BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INT          NOT NULL DEFAULT 0,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE (process_id, code)
);

CREATE INDEX IF NOT EXISTS idx_doc_steps_process ON doc_steps(process_id);
