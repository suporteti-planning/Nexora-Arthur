-- ============================================================
-- V7 — Seed oficial DOC: 26 processos da planilha
-- "Processos Assessoria Legal - Serviços e Etapas Acessórias"
-- Idempotente: ON CONFLICT DO NOTHING / DO UPDATE
-- Substitui os processos genéricos do V5 pelos nomes oficiais.
-- ============================================================

-- ── TRUNCATE SEGURO: remove apenas os dados do catálogo,
--    mantém chamados abertos (doc_ticket_details referencia por FK).
--    Executado apenas se a tabela existir e tiver dados de teste.
-- ── Apaga etapas e processos existentes para recriar limpo.
--    Use ON CONFLICT DO UPDATE para ser idempotente em re-execução.
-- ============================================================

-- 1. Garantir que os processos estejam com os nomes oficiais
-- (upsert por code — se existir, atualiza o nome)

INSERT INTO doc_processes (code, name, sort_order) VALUES
  ('ALT_DENOM_END_OBJ',  '1. ALTERAÇÃO DENOMINAÇÃO / ENDEREÇO / OBJETO SOCIAL',  1),
  ('ALT_QSA_CAPITAL',    '2. ALTERAÇÃO QSA / CAPITAL SOCIAL',                    2),
  ('ALVARA_FUNC',        '3. ALVARÁ DE FUNCIONAMENTO',                            3),
  ('ALVARA_SANIT',       '4. ALVARÁ SANITÁRIO',                                   4),
  ('ARQUIVAMENTO_DOC',   '5. ARQUIVAMENTO DE DOCUMENTOS',                         5),
  ('ATA_AGE_AGO',        '6. ATA AGE / AGO',                                      6),
  ('ATA_REUNIAO_SOC',    '7. ATA DE REUNIÃO DE SÓCIOS',                           7),
  ('ATUAL_REG_RFB',      '8. ATUALIZAÇÃO / REGULARIZAÇÃO RFB',                   8),
  ('BAIXA',              '9. BAIXA',                                              9),
  ('BENEF_FISCAIS',      '10. BENEFICIOS FISCAIS',                               10),
  ('BOMBEIRO',           '11. BOMBEIRO',                                         11),
  ('CERTIDOES',          '12. CERTIDÕES',                                        12),
  ('CONSTITUICAO',       '13. CONSTITUIÇÃO',                                     13),
  ('DEFESA_ADM',         '14. DEFESA ADMINISTRATIVA',                            14),
  ('ENQUAD_DESENQUAD',   '15. ENQUADRAMENTO / DESENQUADRAMENTO',                 15),
  ('ESTADO_REG',         '16. ESTADO / REGULARIZAÇÃO',                           16),
  ('LIC_HORARIO_ESP',    '17. LICENÇA DE HORÁRIO ESPECIAL',                      17),
  ('LIC_PUBLICIDADE',    '18. LICENÇA DE PUBLICIDADE',                           18),
  ('PARALISACAO_SUSP',   '19. PARALIZAÇÃO / SUSPENSÃO',                          19),
  ('PATRIM_AFET_RET',    '20. PATRIMÔNIO DE AFETAÇÃO E ADESÃO AO RET',           20),
  ('PREFEITURA_REG',     '21. PREFEITURA / REGULARIZAÇÃO',                       21),
  ('PUB_CENTRAL_BAL',    '22. PUBLICAÇÃO NA CENTRAL DE BALANÇO',                 22),
  ('LIVROS_SOC',         '23. LIVROS SOCIETÁRIOS',                               23),
  ('REG_CARTORIO',       '24. REGISTRO NO CARTÓRIO',                             24),
  ('REG_OAB',            '25. REGISTRO NA OAB',                                  25),
  ('EBEF',               '26. E-BEF',                                            26)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ── Helper: deleta etapas APENAS dos processos que vamos recriar
--    (evita duplicar em re-execuções)
DELETE FROM doc_steps WHERE process_id IN (
  SELECT id FROM doc_processes WHERE code IN (
    'ALT_DENOM_END_OBJ','ALT_QSA_CAPITAL','ALVARA_FUNC','ALVARA_SANIT',
    'ARQUIVAMENTO_DOC','ATA_AGE_AGO','ATA_REUNIAO_SOC','ATUAL_REG_RFB',
    'BAIXA','BENEF_FISCAIS','BOMBEIRO','CERTIDOES','CONSTITUICAO',
    'DEFESA_ADM','ENQUAD_DESENQUAD','ESTADO_REG','LIC_HORARIO_ESP',
    'LIC_PUBLICIDADE','PARALISACAO_SUSP','PATRIM_AFET_RET','PREFEITURA_REG',
    'PUB_CENTRAL_BAL','LIVROS_SOC','REG_CARTORIO','REG_OAB','EBEF'
  )
);

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 1 — ALTERAÇÃO DENOMINAÇÃO / ENDEREÇO / OBJETO SOCIAL
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P01_S01','Documentação Inicial - Cliente',               NULL,   TRUE,  FALSE, 1),
  ('P01_S02','Enquadramento',                                 NULL,   TRUE,  FALSE, 2),
  ('P01_S03','Elaboração',                                    NULL,   TRUE,  FALSE, 3),
  ('P01_S04','Registro Junta Comercial',                      NULL,   TRUE,  FALSE, 4),
  ('P01_S05','Etapa Email com Endereço Livre para Digitação', NULL,   FALSE, TRUE,  5),
  ('P01_S06','Registro Cartório',                             NULL,   TRUE,  FALSE, 6),
  ('P01_S07','Etapa Email com Endereço Livre para Digitação', NULL,   FALSE, TRUE,  7),
  ('P01_S08','Receita Federal',
   'Informar: Gestão de Risco, equipe contábil, fiscal e Departamento Pessoal que atende esse cliente.',
   TRUE, FALSE, 8),
  ('P01_S09','Etapa Email com Endereço Livre para Digitação', NULL,   FALSE, TRUE,  9),
  ('P01_S10','SEFAZ',                                         NULL,   TRUE,  FALSE, 10),
  ('P01_S11','Prefeitura',                                    NULL,   TRUE,  FALSE, 11),
  ('P01_S12','Emitir Taxa',                                   NULL,   TRUE,  FALSE, 12),
  ('P01_S13','Uso do Solo',                                   NULL,   TRUE,  FALSE, 13),
  ('P01_S14','Número Oficial',                                NULL,   TRUE,  FALSE, 14),
  ('P01_S15','Bombeiro',                                      NULL,   TRUE,  FALSE, 15),
  ('P01_S16','Alvará de Funcionamento',
   'Informar: Equipe contábil e fiscal que atende esse cliente.',
   TRUE, FALSE, 16),
  ('P01_S17','Alvará Sanitário',                              NULL,   TRUE,  FALSE, 17),
  ('P01_S18','Simples Nacional',                              NULL,   TRUE,  FALSE, 18),
  ('P01_S19','Etapa Email com Endereço Livre para Digitação', NULL,   FALSE, TRUE,  19)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'ALT_DENOM_END_OBJ';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 2 — ALTERAÇÃO QSA / CAPITAL SOCIAL
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P02_S01','Documentação Inicial - Cliente',               NULL,   TRUE,  FALSE, 1),
  ('P02_S02','Enquadramento',                                 NULL,   TRUE,  FALSE, 2),
  ('P02_S03','Elaboração',                                    NULL,   TRUE,  FALSE, 3),
  ('P02_S04','Registro Junta Comercial',
   'Informar: Equipe fiscal e Departamento Pessoal que atende esse cliente.',
   TRUE, FALSE, 4),
  ('P02_S05','Etapa Email com Endereço Livre para Digitação', NULL,   FALSE, TRUE,  5),
  ('P02_S06','Registro Cartório',                             NULL,   TRUE,  FALSE, 6),
  ('P02_S07','Etapa Email com Endereço Livre para Digitação', NULL,   FALSE, TRUE,  7),
  ('P02_S08','Receita Federal',                               NULL,   TRUE,  FALSE, 8),
  ('P02_S09','E-BEF',                                         NULL,   TRUE,  FALSE, 9),
  ('P02_S10','Etapa Email com Endereço Livre para Digitação', NULL,   FALSE, TRUE,  10),
  ('P02_S11','SEFAZ',                                         NULL,   TRUE,  FALSE, 11),
  ('P02_S12','Prefeitura',                                    NULL,   TRUE,  FALSE, 12),
  ('P02_S13','Emitir Taxa',                                   NULL,   TRUE,  FALSE, 13)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'ALT_QSA_CAPITAL';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 3 — ALVARÁ DE FUNCIONAMENTO
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P03_S01','Documentação Inicial - Cliente', NULL, TRUE, FALSE, 1),
  ('P03_S02','Uso do Solo',                    NULL, TRUE, FALSE, 2),
  ('P03_S03','Número Oficial',                 NULL, TRUE, FALSE, 3),
  ('P03_S04','Bombeiro',                       NULL, TRUE, FALSE, 4),
  ('P03_S05','Alvará Sanitário',
   'Informar: Equipe contábil e fiscal que atende esse cliente.',
   TRUE, FALSE, 5),
  ('P03_S06','Alvará de Funcionamento',
   'Informar: Equipe contábil e fiscal que atende esse cliente.',
   TRUE, FALSE, 6)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'ALVARA_FUNC';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 4 — ALVARÁ SANITÁRIO
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P04_S01','Documentação Inicial - Cliente', NULL, TRUE, FALSE, 1),
  ('P04_S02','Prefeitura',                     NULL, TRUE, FALSE, 2)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'ALVARA_SANIT';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 5 — ARQUIVAMENTO DE DOCUMENTOS
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P05_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P05_S02','Registro Junta Comercial',                      NULL, TRUE,  FALSE, 2),
  ('P05_S03','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  3)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'ARQUIVAMENTO_DOC';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 6 — ATA AGE / AGO
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P06_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P06_S02','Elaboração',                                    NULL, TRUE,  FALSE, 2),
  ('P06_S03','Registro Junta Comercial',
   'Informar: Equipe contábil e fiscal que atende esse cliente.',
   TRUE, FALSE, 3),
  ('P06_S04','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  4),
  ('P06_S05','Receita Federal',
   'Informar: Equipe contábil e fiscal que atende esse cliente.',
   TRUE, FALSE, 5),
  ('P06_S06','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  6)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'ATA_AGE_AGO';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 7 — ATA DE REUNIÃO DE SÓCIOS
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P07_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P07_S02','Elaboração',                                    NULL, TRUE,  FALSE, 2),
  ('P07_S03','Registro Junta Comercial',
   'Informar: Equipe contábil e fiscal que atende esse cliente.',
   TRUE, FALSE, 3),
  ('P07_S04','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  4)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'ATA_REUNIAO_SOC';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 8 — ATUALIZAÇÃO / REGULARIZAÇÃO RFB
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P08_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P08_S02','Receita Federal',
   'Informar: Gestão de Risco, equipe contábil, fiscal e Departamento Pessoal que atende esse cliente.',
   TRUE, FALSE, 2),
  ('P08_S03','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  3)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'ATUAL_REG_RFB';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 9 — BAIXA
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P09_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P09_S02','Elaboração',                                    NULL, TRUE,  FALSE, 2),
  ('P09_S03','Registro Junta Comercial',                      NULL, TRUE,  FALSE, 3),
  ('P09_S04','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  4),
  ('P09_S05','Registro Cartório',                             NULL, TRUE,  FALSE, 5),
  ('P09_S06','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  6),
  ('P09_S07','Receita Federal',
   'Informar: Gestão de Risco e Sucesso do Cliente.',
   TRUE, FALSE, 7),
  ('P09_S08','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  8),
  ('P09_S09','SEFAZ',                                         NULL, TRUE,  FALSE, 9),
  ('P09_S10','Prefeitura',                                    NULL, TRUE,  FALSE, 10),
  ('P09_S11','Emitir Taxa',                                   NULL, TRUE,  FALSE, 11),
  ('P09_S12','Outros',                                        NULL, FALSE, FALSE, 12)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'BAIXA';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 10 — BENEFICIOS FISCAIS
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P10_S01','Documentação Inicial - Cliente', NULL, TRUE,  FALSE, 1),
  ('P10_S02','IPI',                             NULL, TRUE,  FALSE, 2),
  ('P10_S03','PIS',                             NULL, TRUE,  FALSE, 3),
  ('P10_S04','COFINS',                          NULL, TRUE,  FALSE, 4),
  ('P10_S05','RECAP',                           NULL, TRUE,  FALSE, 5)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'BENEF_FISCAIS';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 11 — BOMBEIRO
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P11_S01','Documentação Inicial - Cliente', NULL, TRUE, FALSE, 1),
  ('P11_S02','Bombeiro',                        NULL, TRUE, FALSE, 2)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'BOMBEIRO';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 12 — CERTIDÕES
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P12_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P12_S02','Junta Comercial',                               NULL, TRUE,  FALSE, 2),
  ('P12_S03','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  3)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'CERTIDOES';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 13 — CONSTITUIÇÃO
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P13_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P13_S02','Elaboração',                                    NULL, FALSE, FALSE, 2),
  ('P13_S03','Registro Junta Comercial',                      NULL, FALSE, FALSE, 3),
  ('P13_S04','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  4),
  ('P13_S05','Registro Cartório',                             NULL, FALSE, FALSE, 5),
  ('P13_S06','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  6),
  ('P13_S07','Receita Federal',
   'Informar: Gestão de Risco e Sucesso do Cliente.',
   FALSE, FALSE, 7),
  ('P13_S08','E-BEF',                                         NULL, FALSE, FALSE, 8),
  ('P13_S09','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  9),
  ('P13_S10','SEFAZ',                                         NULL, FALSE, FALSE, 10),
  ('P13_S11','Prefeitura',                                    NULL, FALSE, FALSE, 11),
  ('P13_S12','Emitir Taxa',                                   NULL, FALSE, FALSE, 12),
  ('P13_S13','Uso do Solo',                                   NULL, FALSE, FALSE, 13),
  ('P13_S14','Número Oficial',                                NULL, FALSE, FALSE, 14),
  ('P13_S15','Bombeiro',                                      NULL, FALSE, FALSE, 15),
  ('P13_S16','Taxa de Potencial de Incêndio',                 NULL, FALSE, FALSE, 16),
  ('P13_S17','Alvará de Funcionamento',
   'Informar: Equipe contábil e fiscal que atende esse cliente.',
   FALSE, FALSE, 17),
  ('P13_S18','Alvará Sanitário',
   'Informar: Equipe contábil e fiscal que atende esse cliente.',
   FALSE, FALSE, 18),
  ('P13_S19','Simples Nacional',                              NULL, FALSE, FALSE, 19),
  ('P13_S20','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  20)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'CONSTITUICAO';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 14 — DEFESA ADMINISTRATIVA
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P14_S01','Documentação Inicial - Cliente', NULL, TRUE, FALSE, 1),
  ('P14_S02','Defesa Administrativa',           NULL, TRUE, FALSE, 2)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'DEFESA_ADM';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 15 — ENQUADRAMENTO / DESENQUADRAMENTO
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P15_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P15_S02','Registro Junta Comercial',
   'Informar: Equipe contábil e fiscal que atende esse cliente.',
   TRUE, FALSE, 2),
  ('P15_S03','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  3),
  ('P15_S04','Receita Federal',
   'Informar: Equipe contábil e fiscal que atende esse cliente.',
   TRUE, FALSE, 4),
  ('P15_S05','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  5)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'ENQUAD_DESENQUAD';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 16 — ESTADO / REGULARIZAÇÃO
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P16_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P16_S02','Reativação de Inscrição Estadual',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 2),
  ('P16_S03','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  3),
  ('P16_S04','Abertura Inscrição Estadual de Produtor Rural',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 4),
  ('P16_S05','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  5),
  ('P16_S06','Abertura de Inscrição Estadual',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 6),
  ('P16_S07','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  7),
  ('P16_S08','Regularização da Inscrição Estadual',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 8),
  ('P16_S09','Abertura de Inscrição de Substituto Tributário',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 9),
  ('P16_S10','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  10),
  ('P16_S11','Baixa da Inscrição Estadual',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 11),
  ('P16_S12','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  12)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'ESTADO_REG';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 17 — LICENÇA DE HORÁRIO ESPECIAL
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P17_S01','Documentação Inicial - Cliente', NULL, TRUE, FALSE, 1),
  ('P17_S02','Prefeitura',                     NULL, TRUE, FALSE, 2)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'LIC_HORARIO_ESP';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 18 — LICENÇA DE PUBLICIDADE
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P18_S01','Documentação Inicial - Cliente', NULL, TRUE, FALSE, 1),
  ('P18_S02','Prefeitura',                     NULL, TRUE, FALSE, 2)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'LIC_PUBLICIDADE';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 19 — PARALIZAÇÃO / SUSPENSÃO
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P19_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P19_S02','Elaboração',                                    NULL, TRUE,  FALSE, 2),
  ('P19_S03','Registro Junta Comercial',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 3),
  ('P19_S04','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  4),
  ('P19_S05','Registro Cartório',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 5),
  ('P19_S06','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  6),
  ('P19_S07','Receita Federal',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 7),
  ('P19_S08','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  8),
  ('P19_S09','SEFAZ',                                         NULL, TRUE,  FALSE, 9),
  ('P19_S10','Prefeitura',                                    NULL, TRUE,  FALSE, 10)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'PARALISACAO_SUSP';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 20 — PATRIMÔNIO DE AFETAÇÃO E ADESÃO AO RET
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P20_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P20_S02','Afetação de Matrícula - Cartório',              NULL, TRUE,  FALSE, 2),
  ('P20_S03','Constituição de CNPJ - RET',
   'Informar: Gestão de Risco, equipe contábil, fiscal que atende esse cliente.',
   TRUE, FALSE, 3),
  ('P20_S04','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  4),
  ('P20_S05','Adesão',                                        NULL, TRUE,  FALSE, 5),
  ('P20_S06','Acompanhamento RET',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 6),
  ('P20_S07','Cadastro DTE',                                  NULL, TRUE,  FALSE, 7),
  ('P20_S08','Ata de Comissão de Representante',              NULL, TRUE,  FALSE, 8)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'PATRIM_AFET_RET';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 21 — PREFEITURA / REGULARIZAÇÃO
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P21_S01','Documentação Inicial - Cliente',               NULL, TRUE,  FALSE, 1),
  ('P21_S02','Abertura de Inscrição Municipal',               NULL, TRUE,  FALSE, 2),
  ('P21_S03','Baixa da Inscrição Municipal',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 3),
  ('P21_S04','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  4),
  ('P21_S05','Reativação de Inscrição Municipal',
   'Informar: Equipe fiscal que atende o cliente.',
   TRUE, FALSE, 5),
  ('P21_S06','Etapa Email com Endereço Livre para Digitação', NULL, FALSE, TRUE,  6)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'PREFEITURA_REG';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 22 — PUBLICAÇÃO NA CENTRAL DE BALANÇO
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P22_S01','Documentação Inicial - Cliente', NULL, TRUE, FALSE, 1),
  ('P22_S02','Central de Balanço',              NULL, TRUE, FALSE, 2)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'PUB_CENTRAL_BAL';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 23 — LIVROS SOCIETÁRIOS
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P23_S01','Documentação Inicial - Cliente',    NULL, TRUE, FALSE, 1),
  ('P23_S02','Livro de Presença de Acionistas',    NULL, TRUE, FALSE, 2),
  ('P23_S03','Livro de Registro de Ata',           NULL, TRUE, FALSE, 3),
  ('P23_S04','Livro de Registro de Ações',         NULL, TRUE, FALSE, 4),
  ('P23_S05','Livro de Transferencia de Ações',    NULL, TRUE, FALSE, 5),
  ('P23_S06','Livro de Reunião de Diretoria',      NULL, TRUE, FALSE, 6),
  ('P23_S07','Livro de Conselho Administração',    NULL, TRUE, FALSE, 7)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'LIVROS_SOC';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 24 — REGISTRO NO CARTÓRIO
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P24_S01','Documentação Inicial - Cliente', NULL, TRUE, FALSE, 1),
  ('P24_S02','Elaboração',                     NULL, TRUE, FALSE, 2),
  ('P24_S03','Outros',                         NULL, FALSE,FALSE, 3),
  ('P24_S04','Averbação no Cartório',           NULL, TRUE, FALSE, 4)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'REG_CARTORIO';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 25 — REGISTRO NA OAB
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P25_S01','Documentação Inicial - Cliente', NULL, TRUE, FALSE, 1),
  ('P25_S02','OAB',                             NULL, TRUE, FALSE, 2)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'REG_OAB';

-- ══════════════════════════════════════════════════════════════
-- PROCESSO 26 — E-BEF
-- ══════════════════════════════════════════════════════════════
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_email_address, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_email, s.sort
FROM doc_processes p,
(VALUES
  ('P26_S01','Documentação Inicial - Cliente', NULL, TRUE, FALSE, 1),
  ('P26_S02','Procuração',                     NULL, TRUE, FALSE, 2),
  ('P26_S03','Declaração E-BEF',               NULL, TRUE, FALSE, 3)
) AS s(code, name, inform_text, req_co, req_email, sort)
WHERE p.code = 'EBEF';

-- ══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (comentada — executar manualmente para validar)
-- ══════════════════════════════════════════════════════════════
-- SELECT p.name, COUNT(s.id) AS total_etapas
-- FROM doc_processes p
-- LEFT JOIN doc_steps s ON s.process_id = p.id
-- GROUP BY p.id, p.name, p.sort_order
-- ORDER BY p.sort_order;
-- Resultado esperado: 26 processos, entre 2 e 20 etapas cada.
