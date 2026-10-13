export type DepartmentEnvironment = 'backoffice' | 'portal';
export type DepartmentStatus = 'available' | 'in-development' | 'planned';

export interface DepartmentModule {
  name: string;
  route?: string;
  status: DepartmentStatus;
}

export interface Department {
  id: string;
  name: string;
  shortName: string;
  description: string;
  responsibilities: string[];
  icon: string; // inline SVG path data
  color: string; // accent color class
  backoffice: DepartmentEnvironment extends 'backoffice' ? {
    status: DepartmentStatus;
    route?: string;
    modules: DepartmentModule[];
  } : never;
  portal: {
    status: DepartmentStatus;
    route?: string;
  };
}

// Re-typing cleanly
export interface DepartmentConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  responsibilities: string[];
  /** Lucide-style SVG viewBox="0 0 24 24" path(s) */
  iconPaths: string[];
  accentColor: string;
  backoffice: {
    status: DepartmentStatus;
    route?: string;
    modules: DepartmentModule[];
  };
  portal: {
    status: DepartmentStatus;
    route?: string;
  };
}

export const DEPARTMENTS: DepartmentConfig[] = [
  {
    id: 'ti',
    name: 'TI — Tecnologia da Informação',
    shortName: 'TI',
    description: 'Infraestrutura, sistemas e suporte técnico corporativo.',
    responsibilities: [
      'Gestão de usuários e acessos',
      'VPN e certificados digitais',
      'Computadores e periféricos',
      'Softwares, sistemas e licenças',
      'Suporte técnico',
    ],
    iconPaths: [
      'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18',
    ],
    accentColor: '#0AE18C',
    backoffice: {
      status: 'available',
      route: '/backoffice/dashboard',
      modules: [
        { name: 'Dashboard',        route: '/backoffice/dashboard',          status: 'available' },
        { name: 'Colaboradores',    route: '/backoffice/employees',          status: 'available' },
        { name: 'Inventário',       route: '/backoffice/equipment-inventory',status: 'available' },
        { name: 'Licenças MS',      route: '/backoffice/licenses',           status: 'available' },
        { name: 'Password Vault',   route: '/backoffice/password-vault',     status: 'available' },
      ],
    },
    portal: { status: 'in-development' },
  },
  {
    id: 'fiscal',
    name: 'Fiscal',
    shortName: 'Fiscal',
    description: 'Apuração tributária, obrigações acessórias e conformidade fiscal.',
    responsibilities: [
      'Apuração tributária',
      'Obrigações acessórias',
      'SPED Fiscal',
      'Documentos fiscais',
      'Controle de prazos',
    ],
    iconPaths: [
      'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
    ],
    accentColor: '#3B82F6',
    backoffice: {
      status: 'in-development',
      modules: [],
    },
    portal: { status: 'planned' },
  },
  {
    id: 'contabil',
    name: 'Contábil',
    shortName: 'Contábil',
    description: 'Escrituração, conciliações e demonstrações financeiras.',
    responsibilities: [
      'Escrituração contábil',
      'Conciliações',
      'Fechamento contábil',
      'Demonstrações financeiras',
      'Obrigações contábeis',
    ],
    iconPaths: [
      'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    ],
    accentColor: '#8B5CF6',
    backoffice: {
      status: 'in-development',
      modules: [],
    },
    portal: { status: 'planned' },
  },
  {
    id: 'dp',
    name: 'DP — Departamento Pessoal',
    shortName: 'DP',
    description: 'Rotinas trabalhistas, folha de pagamento e encargos.',
    responsibilities: [
      'Admissões e rescisões',
      'Folha de pagamento',
      'Férias e afastamentos',
      'Encargos sociais',
      'eSocial e obrigações trabalhistas',
    ],
    iconPaths: [
      'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
      'M23 21v-2a4 4 0 0 0-3-3.87',
      'M16 3.13a4 4 0 0 1 0 7.75',
      'M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
    ],
    accentColor: '#F59E0B',
    backoffice: {
      status: 'in-development',
      modules: [],
    },
    portal: { status: 'planned' },
  },
  {
    id: 'rh',
    name: 'RH/GG — Recursos Humanos',
    shortName: 'RH/GG',
    description: 'Recrutamento, desenvolvimento e cultura organizacional.',
    responsibilities: [
      'Recrutamento e seleção',
      'Onboarding de pessoas',
      'Treinamentos',
      'Avaliação de desempenho',
      'Desenvolvimento organizacional',
    ],
    iconPaths: [
      'M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0zM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0zM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003z',
    ],
    accentColor: '#EC4899',
    backoffice: {
      status: 'in-development',
      modules: [],
    },
    portal: { status: 'planned' },
  },
  {
    id: 'doc',
    name: 'DOC — Documentação',
    shortName: 'DOC',
    description: 'Controle de documentos, certificados e processos documentais.',
    responsibilities: [
      'Controle de documentos',
      'Certificados e validades',
      'Onboarding documental',
      'Offboarding documental',
      'Pendências e conformidade',
    ],
    iconPaths: [
      'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z',
    ],
    accentColor: '#06B6D4',
    backoffice: {
      status: 'in-development',
      modules: [],
    },
    portal: { status: 'planned' },
  },
  {
    id: 'financeiro',
    name: 'Financeiro/Compras',
    shortName: 'Financeiro',
    description: 'Fluxo de caixa, fornecedores e gestão de despesas.',
    responsibilities: [
      'Contas a pagar e a receber',
      'Despesas e reembolsos',
      'Fluxo de caixa',
      'Cotações e fornecedores',
      'Aquisições e compras',
    ],
    iconPaths: [
      'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
    ],
    accentColor: '#10B981',
    backoffice: {
      status: 'in-development',
      modules: [],
    },
    portal: { status: 'planned' },
  },
  {
    id: 'risco',
    name: 'Gestão de Risco',
    shortName: 'Risco',
    description: 'Riscos operacionais, controles internos e não conformidades.',
    responsibilities: [
      'Riscos operacionais',
      'Controles internos',
      'Registro de incidentes',
      'Não conformidades',
      'Planos de ação',
    ],
    iconPaths: [
      'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    ],
    accentColor: '#EF4444',
    backoffice: {
      status: 'in-development',
      modules: [],
    },
    portal: { status: 'planned' },
  },
  {
    id: 'dev',
    name: 'Desenvolvimento/Automação',
    shortName: 'Dev/Auto',
    description: 'Aplicações internas, integrações e melhoria de processos.',
    responsibilities: [
      'Aplicações internas',
      'Scripts e automações',
      'Integrações e APIs',
      'Melhoria de processos',
      'Documentação técnica',
    ],
    iconPaths: [
      'M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25z',
    ],
    accentColor: '#F97316',
    backoffice: {
      status: 'in-development',
      modules: [],
    },
    portal: { status: 'planned' },
  },
];

export const STATUS_LABELS: Record<DepartmentStatus, string> = {
  'available':      'Disponível',
  'in-development': 'Em desenvolvimento',
  'planned':        'Planejado',
};
