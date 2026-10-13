-- ============================================================
-- V4 — Sistema de chamados
-- ============================================================

CREATE TABLE IF NOT EXISTS tickets (
    id               BIGSERIAL PRIMARY KEY,
    number           VARCHAR(20)  NOT NULL UNIQUE,   -- ex: TKT-2024-00001
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    priority         VARCHAR(20)  NOT NULL DEFAULT 'MEDIA',
    status           VARCHAR(30)  NOT NULL DEFAULT 'NOVO',
    dest_department  VARCHAR(50)  NOT NULL,           -- TI, DOC, RH, DP, FINANCEIRO, RISCO
    requester_id     BIGINT       NOT NULL REFERENCES users(id),
    assignee_id      BIGINT       REFERENCES users(id),
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    closed_at        TIMESTAMP,
    source_route     VARCHAR(100)                     -- rota de origem
);

-- Detalhes específicos de chamados DOC
CREATE TABLE IF NOT EXISTS doc_ticket_details (
    id             BIGSERIAL PRIMARY KEY,
    ticket_id      BIGINT  NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
    process_id     BIGINT  NOT NULL REFERENCES doc_processes(id),
    step_id        BIGINT  NOT NULL REFERENCES doc_steps(id),
    company_name   VARCHAR(255),
    company_cnpj   VARCHAR(20),
    extra_data     JSONB                              -- campos adicionais por etapa
);

-- Histórico de alterações de chamados
CREATE TABLE IF NOT EXISTS ticket_history (
    id           BIGSERIAL PRIMARY KEY,
    ticket_id    BIGINT      NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    changed_by   BIGINT      NOT NULL REFERENCES users(id),
    field_name   VARCHAR(100),
    old_value    TEXT,
    new_value    TEXT,
    note         TEXT,
    changed_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Anexos de chamados
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id            BIGSERIAL PRIMARY KEY,
    ticket_id     BIGINT      NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_name     VARCHAR(255) NOT NULL,
    file_path     VARCHAR(512) NOT NULL,
    content_type  VARCHAR(100),
    file_size     BIGINT,
    uploaded_by   BIGINT      NOT NULL REFERENCES users(id),
    uploaded_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tickets_requester   ON tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee    ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_dept        ON tickets(dest_department);
CREATE INDEX IF NOT EXISTS idx_tickets_status      ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_history_tid  ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attach_tid   ON ticket_attachments(ticket_id);

-- Sequence para numeração amigável
CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1 INCREMENT 1;
