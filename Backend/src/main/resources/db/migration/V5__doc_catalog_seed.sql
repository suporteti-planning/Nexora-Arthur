-- ============================================================
-- V5 — Seed do catálogo DOC
-- 26 processos com etapas e orientações (coluna "Informar")
-- Idempotente: INSERT … ON CONFLICT DO NOTHING
-- ============================================================

-- ── Processos ────────────────────────────────────────────────────────────────
INSERT INTO doc_processes (code, name, sort_order) VALUES
  ('ABERTURA_EMP',       'Abertura de Empresa',                           1),
  ('ALTERACAO_CONTRATO', 'Alteração de Contrato Social',                  2),
  ('ENCERRAMENTO_EMP',   'Encerramento de Empresa',                       3),
  ('CERTIDAO_NEGATIVA',  'Certidão Negativa',                             4),
  ('PROCURACAO',         'Procuração',                                    5),
  ('CONTRATO_SOCIAL',    'Registro de Contrato Social',                   6),
  ('JUNTA_COMERCIAL',    'Junta Comercial',                               7),
  ('RECEITA_FEDERAL',    'Receita Federal — CNPJ',                        8),
  ('INSS_EMPRESA',       'INSS — Cadastro e Manutenção',                  9),
  ('PREFEITURA',         'Prefeitura — Alvará e ISS',                    10),
  ('ANVISA',             'ANVISA — Licenciamento',                        11),
  ('SINTEGRA',           'SINTEGRA / SEFAZ',                              12),
  ('SIMPLES_NACIONAL',   'Simples Nacional',                              13),
  ('MEI',                'MEI — Microempreendedor Individual',            14),
  ('REGISTRO_MARCA',     'Registro de Marca — INPI',                     15),
  ('REGISTRO_DOMINIO',   'Registro de Domínio — Registro.br',            16),
  ('LGPD',               'LGPD — Adequação e Documentos',                17),
  ('CONTRATO_SOCIAL_PF', 'Contrato — Pessoa Física',                     18),
  ('CONTRATO_SOCIAL_PJ', 'Contrato — Pessoa Jurídica',                   19),
  ('ATA_REUNIAO',        'Ata de Reunião Societária',                    20),
  ('DISTRATO',           'Distrato Social',                              21),
  ('FUSAO_CISAO',        'Fusão e Cisão de Empresas',                    22),
  ('LIVROS_CONTABEIS',   'Autenticação de Livros Contábeis',             23),
  ('PROCURACAO_PUBLICA', 'Procuração Pública / Reconhecimento',          24),
  ('CERTIDAO_CARTORIO',  'Certidão Cartorária',                          25),
  ('OUTROS_DOC',         'Outros Serviços Documentais',                  26)
ON CONFLICT (code) DO NOTHING;

-- ── Etapas por processo ───────────────────────────────────────────────────────

-- 1. Abertura de Empresa
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('ABER_VIAB',    'Consulta de Viabilidade',
        'Informe: nome empresarial desejado, endereço completo com CEP e CNAE pretendido.',
        FALSE, FALSE, 1),
       ('ABER_DOCS',    'Coleta de Documentos dos Sócios',
        'Informe: CPF, RG, comprovante de residência e qualificação de cada sócio.',
        FALSE, TRUE, 2),
       ('ABER_CONTRATO','Elaboração do Contrato Social',
        'Informe: objeto social, capital social, participação de cada sócio e endereço da sede.',
        FALSE, FALSE, 3),
       ('ABER_REGISTRO','Registro na Junta Comercial / Cartório',
        'Informe: documentos dos sócios assinados e contrato social finalizado.',
        TRUE, TRUE, 4),
       ('ABER_CNPJ',    'Obtenção do CNPJ',
        'Realizado após o registro. Informe: número de protocolo da Junta.',
        TRUE, FALSE, 5),
       ('ABER_INSC_MUN','Inscrição Municipal / Alvará',
        'Informe: CNPJ obtido e endereço da sede para protocolo na prefeitura.',
        TRUE, FALSE, 6)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'ABERTURA_EMP'
ON CONFLICT (process_id, code) DO NOTHING;

-- 2. Alteração de Contrato Social
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('ALT_TIPO',    'Tipo de Alteração',
        'Informe: o que será alterado (razão social, endereço, sócios, objeto, capital ou outros).',
        TRUE, FALSE, 1),
       ('ALT_DOCS',    'Documentação Necessária',
        'Informe: contrato social atual, documentos dos sócios e documentos específicos da alteração.',
        TRUE, TRUE, 2),
       ('ALT_ELAB',    'Elaboração do Aditivo / Nova Consolidação',
        'A equipe elaborará o documento com base nas informações fornecidas.',
        TRUE, FALSE, 3),
       ('ALT_REG',     'Registro da Alteração',
        'Informe: documentos assinados para protocolo na Junta Comercial ou Cartório.',
        TRUE, TRUE, 4),
       ('ALT_ATUALIZACAO','Atualização Cadastral CNPJ / Receita',
        'Após registro, atualizamos os dados na Receita Federal.',
        TRUE, FALSE, 5)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'ALTERACAO_CONTRATO'
ON CONFLICT (process_id, code) DO NOTHING;

-- 3. Encerramento de Empresa
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('ENC_CHECKLIST','Checklist de Encerramento',
        'Informe: CNPJ, razão social e confirme que não há débitos ou pendências.',
        TRUE, FALSE, 1),
       ('ENC_DISTRATO', 'Elaboração do Distrato',
        'Informe: data do encerramento, destinação do patrimônio e assinatura dos sócios.',
        TRUE, FALSE, 2),
       ('ENC_BAIXA_CNPJ','Baixa do CNPJ na Receita Federal',
        'Necessário distrato assinado e registro na Junta. Informe se há filiais.',
        TRUE, TRUE, 3),
       ('ENC_BAIXA_MUN','Baixa Municipal e Estadual',
        'Informe: inscrição municipal (CCM) e inscrição estadual, se aplicável.',
        TRUE, FALSE, 4),
       ('ENC_CERTIDOES','Obtenção de Certidões de Baixa',
        'Solicitamos as certidões após processamento de todas as baixas.',
        TRUE, FALSE, 5)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'ENCERRAMENTO_EMP'
ON CONFLICT (process_id, code) DO NOTHING;

-- 4. Certidão Negativa
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('CN_FEDERAL',  'Certidão Negativa Federal (Receita / PGF)',
        'Informe: CNPJ ou CPF. A certidão é emitida automaticamente se não houver débitos.',
        TRUE, FALSE, 1),
       ('CN_ESTADUAL', 'Certidão Negativa Estadual (SEFAZ)',
        'Informe: CNPJ e UF. Cada estado possui procedimento próprio.',
        TRUE, FALSE, 2),
       ('CN_MUNICIPAL','Certidão Negativa Municipal',
        'Informe: CNPJ e município. Algumas prefeituras cobram taxa de emissão.',
        TRUE, FALSE, 3),
       ('CN_TRABALHISTA','Certidão Negativa Trabalhista (TST)',
        'Informe: CNPJ ou CPF. Emitida pelo portal do TST.',
        TRUE, FALSE, 4),
       ('CN_FGTS',     'Certidão de Regularidade do FGTS (CEF)',
        'Informe: CNPJ. Emitida pela Caixa Econômica Federal.',
        TRUE, FALSE, 5)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'CERTIDAO_NEGATIVA'
ON CONFLICT (process_id, code) DO NOTHING;

-- 5. Procuração
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('PROC_TIPO',   'Tipo de Procuração',
        'Informe: se é pública (lavrada em cartório) ou particular; poderes a conferir e vigência.',
        FALSE, FALSE, 1),
       ('PROC_DADOS',  'Dados do Outorgante e Outorgado',
        'Informe: nome completo, CPF/CNPJ, RG, endereço e qualificação de ambas as partes.',
        FALSE, FALSE, 2),
       ('PROC_ELAB',   'Elaboração do Instrumento',
        'A equipe elabora o texto com base nos poderes informados.',
        FALSE, FALSE, 3),
       ('PROC_ASSINA', 'Assinatura e Reconhecimento',
        'Informe se deseja reconhecimento de firma em cartório ou assinatura digital (ICP-Brasil).',
        FALSE, TRUE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'PROCURACAO'
ON CONFLICT (process_id, code) DO NOTHING;

-- 6. Registro de Contrato Social
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('REG_TIPO',    'Tipo de Registro (Junta / Cartório)',
        'Informe: tipo jurídico (Ltda, SA, SLU, EIRELI, Associação, etc.) para determinar o órgão.',
        FALSE, FALSE, 1),
       ('REG_DOCS',    'Documentação dos Sócios',
        'Informe: CPF, RG, comprovante de residência e estado civil de cada sócio.',
        FALSE, TRUE, 2),
       ('REG_PROTOCOLO','Protocolo',
        'Realizamos o protocolo presencial ou digital conforme o órgão competente.',
        TRUE, TRUE, 3),
       ('REG_DEFERIMENTO','Acompanhamento e Deferimento',
        'Acompanhamos o processo até o deferimento e envio do NIRE/CNPJ.',
        TRUE, FALSE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'CONTRATO_SOCIAL'
ON CONFLICT (process_id, code) DO NOTHING;

-- 7. Junta Comercial
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('JC_PROTOCOLO','Protocolo de Documento',
        'Informe: tipo de ato (abertura, alteração, encerramento, autenticação) e documentos digitalizados.',
        TRUE, TRUE, 1),
       ('JC_ACOMP',   'Acompanhamento do Processo',
        'Monitoramos o status até o deferimento. Prazo médio: 3 a 10 dias úteis.',
        TRUE, FALSE, 2),
       ('JC_RETIRADA','Retirada / Download do Documento Deferido',
        'Enviamos o documento deferido por e-mail ou disponibilizamos no portal.',
        TRUE, FALSE, 3)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'JUNTA_COMERCIAL'
ON CONFLICT (process_id, code) DO NOTHING;

-- 8. Receita Federal — CNPJ
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('RF_CONSULTA', 'Consulta de Situação Cadastral',
        'Informe: CNPJ para verificar situação (Ativa, Suspensa, Inapta ou Baixada).',
        TRUE, FALSE, 1),
       ('RF_ATUALIZACAO','Atualização Cadastral',
        'Informe: dado a atualizar (endereço, sócios, CNAE, natureza jurídica).',
        TRUE, FALSE, 2),
       ('RF_REATIVACAO','Reativação / Regularização',
        'Informe: motivo da suspensão e documentos de regularização disponíveis.',
        TRUE, TRUE, 3),
       ('RF_CNPJ_BAIXA','Baixa do CNPJ',
        'Informe: CNPJ, confirme ausência de débitos e envie distrato registrado.',
        TRUE, TRUE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'RECEITA_FEDERAL'
ON CONFLICT (process_id, code) DO NOTHING;

-- 9. INSS — Cadastro e Manutenção
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('INSS_CAD',    'Cadastro de Empresa no INSS / CNIS',
        'Informe: CNPJ, razão social, atividade e responsável legal.',
        TRUE, FALSE, 1),
       ('INSS_CERT',   'Certidão de Regularidade (CRF)',
        'Informe: CNPJ. Emitida pelo portal da Receita/INSS.',
        TRUE, FALSE, 2),
       ('INSS_PARCEL', 'Parcelamento de Débitos',
        'Informe: valor aproximado da dívida e período de origem para avaliar modalidade.',
        TRUE, FALSE, 3)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'INSS_EMPRESA'
ON CONFLICT (process_id, code) DO NOTHING;

-- 10. Prefeitura — Alvará e ISS
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('PREF_ALVARA', 'Licença / Alvará de Funcionamento',
        'Informe: CNPJ, endereço, atividade (CNAE) e área do imóvel.',
        TRUE, FALSE, 1),
       ('PREF_ISS_CAD','Inscrição Municipal (ISS)',
        'Informe: CNPJ, contrato social registrado e endereço da sede.',
        TRUE, TRUE, 2),
       ('PREF_ISS_NOTA','Autorização de Nota Fiscal Eletrônica de Serviço',
        'Necessária inscrição municipal ativa. Informe: contador responsável.',
        TRUE, FALSE, 3),
       ('PREF_RENOVACAO','Renovação de Alvará',
        'Informe: número do alvará atual e data de vencimento.',
        TRUE, FALSE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'PREFEITURA'
ON CONFLICT (process_id, code) DO NOTHING;

-- 11. ANVISA
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('ANV_CAD',     'Cadastro de Empresa na ANVISA',
        'Informe: CNPJ, razão social, produto/atividade regulada e responsável técnico.',
        TRUE, FALSE, 1),
       ('ANV_LICENCA', 'Licença de Funcionamento',
        'Informe: tipo de produto (alimento, cosméticos, saneantes, correlatos, medicamentos).',
        TRUE, TRUE, 2),
       ('ANV_RENOVACAO','Renovação de Licença',
        'Informe: número do processo ANVISA e data de vencimento.',
        TRUE, FALSE, 3)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'ANVISA'
ON CONFLICT (process_id, code) DO NOTHING;

-- 12. SINTEGRA / SEFAZ
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('SEFAZ_INSC',  'Inscrição Estadual',
        'Informe: CNPJ, CNAE, endereço e tipo de contribuinte (ICMS).',
        TRUE, TRUE, 1),
       ('SEFAZ_ALTER', 'Alteração de Inscrição Estadual',
        'Informe: dado a alterar e documentação comprobatória.',
        TRUE, TRUE, 2),
       ('SEFAZ_BAIXA', 'Baixa de Inscrição Estadual',
        'Informe: inscrição estadual e CNPJ. Necessário livros fiscais.',
        TRUE, TRUE, 3),
       ('SEFAZ_CERT',  'Certidão de Regularidade Estadual',
        'Informe: CNPJ e UF.',
        TRUE, FALSE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'SINTEGRA'
ON CONFLICT (process_id, code) DO NOTHING;

-- 13. Simples Nacional
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('SN_OPCAO',    'Opção pelo Simples Nacional',
        'Informe: CNPJ, data de abertura. A opção deve ser feita em janeiro ou no mês de abertura.',
        TRUE, FALSE, 1),
       ('SN_EXCLUSAO', 'Exclusão do Simples Nacional',
        'Informe: motivo (excesso de receita, atividade vedada ou opção voluntária).',
        TRUE, FALSE, 2),
       ('SN_REGULARIZ','Regularização de Pendências',
        'Informe: pendências identificadas (débitos, declarações omissas).',
        TRUE, FALSE, 3),
       ('SN_CERT',     'Consulta de Situação no Simples',
        'Informe: CNPJ para verificação.',
        TRUE, FALSE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'SIMPLES_NACIONAL'
ON CONFLICT (process_id, code) DO NOTHING;

-- 14. MEI
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('MEI_ABERTURA','Abertura de MEI',
        'Informe: CPF, atividade desejada (CNAE) e endereço.',
        FALSE, FALSE, 1),
       ('MEI_ALTER',   'Alteração Cadastral de MEI',
        'Informe: dado a alterar (endereço, atividade, nome fantasia).',
        TRUE, FALSE, 2),
       ('MEI_BAIXA',   'Baixa de MEI',
        'Informe: CNPJ MEI e confirme ausência de pendências.',
        TRUE, FALSE, 3),
       ('MEI_CERT',    'Certidão e Comprovante MEI',
        'Informe: CNPJ do MEI. Emitimos CCMEI e certidões necessárias.',
        TRUE, FALSE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'MEI'
ON CONFLICT (process_id, code) DO NOTHING;

-- 15. Registro de Marca — INPI
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('INPI_BUSCA',  'Busca de Anterioridade',
        'Informe: nome/logotipo desejado e classe NCL (produto ou serviço).',
        FALSE, FALSE, 1),
       ('INPI_DEPOSITO','Depósito do Pedido',
        'Informe: imagem da marca (se figurativa/mista), CPF/CNPJ do titular e natureza.',
        FALSE, TRUE, 2),
       ('INPI_ACOMP',  'Acompanhamento do Processo',
        'Monitoramos o andamento: exame formal, publicação e eventuais oposições.',
        FALSE, FALSE, 3),
       ('INPI_CERTIF', 'Certificado de Registro',
        'Após deferimento emitimos o certificado. Validade: 10 anos, renovável.',
        FALSE, FALSE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'REGISTRO_MARCA'
ON CONFLICT (process_id, code) DO NOTHING;

-- 16. Registro de Domínio — Registro.br
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('DOM_VERIF',   'Verificação de Disponibilidade',
        'Informe: nome do domínio desejado (ex: empresa.com.br).',
        FALSE, FALSE, 1),
       ('DOM_REG',     'Registro do Domínio',
        'Informe: CPF/CNPJ do titular, e-mail de contato e dados do responsável técnico.',
        FALSE, FALSE, 2),
       ('DOM_RENOV',   'Renovação de Domínio',
        'Informe: domínio existente e data de vencimento.',
        FALSE, FALSE, 3)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'REGISTRO_DOMINIO'
ON CONFLICT (process_id, code) DO NOTHING;

-- 17. LGPD
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('LGPD_DIAG',   'Diagnóstico de Adequação',
        'Mapeamos os dados tratados pela empresa. Informe: setor, porte e principais operações.',
        TRUE, FALSE, 1),
       ('LGPD_POLITICA','Política de Privacidade',
        'Elaboramos o documento. Informe: canal de atendimento ao titular de dados.',
        TRUE, FALSE, 2),
       ('LGPD_DPO',    'Indicação do DPO (Encarregado)',
        'Informe: nome e contato do DPO indicado ou solicite indicação pela equipe.',
        TRUE, FALSE, 3),
       ('LGPD_CONTRATO','Contratos e Termos de Consentimento',
        'Informe: tipos de dados coletados (clientes, funcionários, fornecedores).',
        TRUE, FALSE, 4),
       ('LGPD_RELATORIO','Relatório de Impacto (RIPD)',
        'Necessário para tratamentos de alto risco. Informe: operação de tratamento envolvida.',
        TRUE, FALSE, 5)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'LGPD'
ON CONFLICT (process_id, code) DO NOTHING;

-- 18. Contrato — Pessoa Física
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('CTPF_TIPO',   'Tipo de Contrato',
        'Informe: tipo (prestação de serviço, compra e venda, locação, comodato, etc.).',
        FALSE, FALSE, 1),
       ('CTPF_DADOS',  'Dados das Partes',
        'Informe: nome completo, CPF, RG, endereço, estado civil de cada parte.',
        FALSE, FALSE, 2),
       ('CTPF_ELAB',   'Elaboração e Revisão',
        'A equipe elabora e revisa o contrato com base nas cláusulas informadas.',
        FALSE, FALSE, 3),
       ('CTPF_ASSINA', 'Assinatura e Registro',
        'Informe: se deseja reconhecimento de firma ou assinatura eletrônica (ICP-Brasil).',
        FALSE, TRUE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'CONTRATO_SOCIAL_PF'
ON CONFLICT (process_id, code) DO NOTHING;

-- 19. Contrato — Pessoa Jurídica
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('CTPJ_TIPO',   'Tipo de Contrato',
        'Informe: tipo (fornecimento, parceria, prestação de serviço, NDA, SLA, etc.).',
        TRUE, FALSE, 1),
       ('CTPJ_DADOS',  'Dados das Partes',
        'Informe: razão social, CNPJ, endereço sede e representante legal.',
        TRUE, FALSE, 2),
       ('CTPJ_ELAB',   'Elaboração e Revisão',
        'Elaboramos com base nas condições comerciais informadas.',
        TRUE, FALSE, 3),
       ('CTPJ_ASSINA', 'Assinatura Digital / Física',
        'Informe: plataforma de assinatura utilizada (Docusign, ClickSign, etc.) ou se física.',
        TRUE, FALSE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'CONTRATO_SOCIAL_PJ'
ON CONFLICT (process_id, code) DO NOTHING;

-- 20. Ata de Reunião Societária
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('ATA_ELAB',    'Elaboração da Ata',
        'Informe: data, local, sócios presentes, pauta e deliberações.',
        TRUE, FALSE, 1),
       ('ATA_ASSINA',  'Assinatura pelos Sócios',
        'Enviaremos a minuta para assinatura por todos os presentes.',
        TRUE, FALSE, 2),
       ('ATA_REG',     'Registro em Cartório ou Junta',
        'Informe: se o ato requer registro para produzir efeitos perante terceiros.',
        TRUE, TRUE, 3)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'ATA_REUNIAO'
ON CONFLICT (process_id, code) DO NOTHING;

-- 21. Distrato Social
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('DIS_ELAB',    'Elaboração do Distrato',
        'Informe: CNPJ, razão social, data de dissolução e destinação do patrimônio.',
        TRUE, FALSE, 1),
       ('DIS_ASSINA',  'Assinatura dos Sócios',
        'Todos os sócios devem assinar o distrato.',
        TRUE, FALSE, 2),
       ('DIS_REGISTRO','Registro e Baixa',
        'Realizamos o registro na Junta e solicitamos a baixa do CNPJ.',
        TRUE, TRUE, 3)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'DISTRATO'
ON CONFLICT (process_id, code) DO NOTHING;

-- 22. Fusão e Cisão
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('FC_TIPO',     'Tipo de Operação',
        'Informe: fusão (duas empresas formam uma nova), incorporação (uma absorve outra) ou cisão (divisão).',
        TRUE, FALSE, 1),
       ('FC_DOCS',     'Documentação das Empresas Envolvidas',
        'Informe: contratos sociais, balanços, certidões e lista de sócios de todas as empresas.',
        TRUE, TRUE, 2),
       ('FC_PROTOCOLO','Protocolo e Justificativa',
        'Elaboramos o protocolo de fusão/cisão conforme Lei 6.404/76.',
        TRUE, FALSE, 3),
       ('FC_REGISTRO', 'Registro na Junta Comercial',
        'Protocolo e documentos assinados para registro.',
        TRUE, TRUE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'FUSAO_CISAO'
ON CONFLICT (process_id, code) DO NOTHING;

-- 23. Autenticação de Livros Contábeis
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('LIV_TIPO',    'Tipo de Livro',
        'Informe: Diário, Razão, Inventário ou Livro Caixa.',
        TRUE, FALSE, 1),
       ('LIV_DIGITAL', 'Autenticação Digital (SPED)',
        'Para empresas obrigadas ao SPED. Informe: período de referência.',
        TRUE, FALSE, 2),
       ('LIV_FISICO',  'Autenticação em Junta Comercial (físico)',
        'Informe: quantidade de folhas e ano de referência.',
        TRUE, TRUE, 3)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'LIVROS_CONTABEIS'
ON CONFLICT (process_id, code) DO NOTHING;

-- 24. Procuração Pública / Reconhecimento
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('PROC_PUB',    'Procuração Pública em Cartório',
        'Informe: dados do outorgante e outorgado, poderes e finalidade.',
        FALSE, FALSE, 1),
       ('PROC_RECFIRMA','Reconhecimento de Firma',
        'Informe: tipo (por semelhança ou autenticidade) e cartório de preferência.',
        FALSE, TRUE, 2),
       ('PROC_AUTENT', 'Autenticação de Documentos',
        'Informe: quantidade de folhas e tipo de documento.',
        FALSE, TRUE, 3)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'PROCURACAO_PUBLICA'
ON CONFLICT (process_id, code) DO NOTHING;

-- 25. Certidão Cartorária
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('CERT_NASC',   'Certidão de Nascimento / Casamento / Óbito',
        'Informe: dados do titular (nome completo, data e local do registro).',
        FALSE, FALSE, 1),
       ('CERT_IMOVEL', 'Certidão de Imóvel (CRI)',
        'Informe: endereço completo do imóvel e matrícula, se disponível.',
        FALSE, FALSE, 2),
       ('CERT_NEGATIVA_CART','Certidão Negativa de Protestos',
        'Informe: CPF/CNPJ e praça(s) a pesquisar.',
        FALSE, FALSE, 3),
       ('CERT_DISTRIB','Certidão de Distribuição (Judicial)',
        'Informe: CPF/CNPJ, esfera (federal/estadual/trabalhista) e UF.',
        FALSE, FALSE, 4)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'CERTIDAO_CARTORIO'
ON CONFLICT (process_id, code) DO NOTHING;

-- 26. Outros Serviços Documentais
INSERT INTO doc_steps (process_id, code, name, inform_text, requires_company, requires_documents, sort_order)
SELECT p.id, s.code, s.name, s.inform_text, s.req_co, s.req_doc, s.sort
FROM doc_processes p,
     (VALUES
       ('OUT_DESCR',   'Descrição do Serviço',
        'Descreva detalhadamente o serviço solicitado, incluindo prazo e necessidades específicas.',
        FALSE, FALSE, 1),
       ('OUT_DOCS',    'Documentos de Apoio',
        'Anexe os documentos relevantes para análise da equipe DOC.',
        FALSE, TRUE, 2)
     ) AS s(code, name, inform_text, req_co, req_doc, sort)
WHERE p.code = 'OUTROS_DOC'
ON CONFLICT (process_id, code) DO NOTHING;
