import { ChecklistTemplate, Task } from '@/types';

// Tarefas de exemplo por função
const secretaryTasks: Task[] = [
  {
    id: 'sec-1',
    title: 'Verificar e responder e-mails',
    description: 'Revisar todos os e-mails e responder aos urgentes',
    category: 'Comunicação',
    priority: 'high',
    period: 'start_day',
    frequency: 'daily',
    isRequired: true
  },
  {
    id: 'sec-2',
    title: 'Agendar reuniões do dia',
    description: 'Confirmar todas as reuniões e enviar lembretes',
    category: 'Agendamento',
    priority: 'high',
    period: 'start_shift',
    frequency: 'daily',
    isRequired: true
  },
  {
    id: 'sec-3',
    title: 'Atualizar relatórios de status dos projetos',
    description: 'Revisar e atualizar o status dos projetos em andamento',
    category: 'Administração',
    priority: 'medium',
    period: 'end_shift',
    frequency: 'daily',
    isRequired: true
  },
  {
    id: 'sec-4',
    title: 'Arquivar documentos',
    description: 'Organizar e arquivar documentos recebidos',
    category: 'Administração',
    priority: 'low',
    period: 'end_day',
    frequency: 'weekly',
    weekDay: 5, // Sexta-feira
    isRequired: false
  },
  {
    id: 'sec-5',
    title: 'Preparar relatório diário resumido',
    description: 'Compilar atividades e enviar para a gerência',
    category: 'Relatórios',
    priority: 'medium',
    period: 'end_day',
    frequency: 'daily',
    isRequired: true
  }
];

const nurseTasks: Task[] = [
  {
    id: 'nurse-1',
    title: 'Ronda matinal dos pacientes',
    description: 'Verificar todos os pacientes designados',
    category: 'Cuidado do Paciente',
    priority: 'high',
    period: 'start_day',
    frequency: 'daily',
    isRequired: true
  },
  {
    id: 'nurse-2',
    title: 'Administração de medicamentos',
    description: 'Administrar medicamentos programados',
    category: 'Medicação',
    priority: 'high',
    period: 'start_shift',
    frequency: 'daily',
    isRequired: true
  },
  {
    id: 'nurse-3',
    title: 'Atualizar prontuários dos pacientes',
    description: 'Registrar observações e progresso dos pacientes',
    category: 'Documentação',
    priority: 'high',
    period: 'end_shift',
    frequency: 'daily',
    isRequired: true
  },
  {
    id: 'nurse-4',
    title: 'Verificação de equipamentos',
    description: 'Verificar se todos os equipamentos médicos estão funcionais',
    category: 'Segurança',
    priority: 'medium',
    period: 'start_day',
    frequency: 'weekly',
    weekDay: 1, // Segunda-feira
    isRequired: true
  },
  {
    id: 'nurse-5',
    title: 'Comunicação com familiares',
    description: 'Atualizar familiares sobre o status dos pacientes',
    category: 'Comunicação',
    priority: 'medium',
    period: 'end_day',
    frequency: 'daily',
    isRequired: false
  }
];

const sdrTasks: Task[] = [
  {
    id: 'sdr-1',
    title: 'Ligações frias para prospects',
    description: 'Fazer 50 ligações ativas para prospects',
    category: 'Vendas',
    priority: 'high',
    period: 'start_shift',
    frequency: 'daily',
    isRequired: true
  },
  {
    id: 'sdr-2',
    title: 'Atualizar registros do CRM',
    description: 'Atualizar todas as interações com prospects no CRM',
    category: 'Administração',
    priority: 'high',
    period: 'end_shift',
    frequency: 'daily',
    isRequired: true
  },
  {
    id: 'sdr-3',
    title: 'Enviar e-mails de follow-up',
    description: 'Enviar e-mails personalizados de acompanhamento',
    category: 'Comunicação',
    priority: 'medium',
    period: 'start_day',
    frequency: 'daily',
    isRequired: true
  },
  {
    id: 'sdr-4',
    title: 'Pesquisar novos leads',
    description: 'Pesquisar e qualificar novos leads potenciais',
    category: 'Pesquisa',
    priority: 'medium',
    period: 'start_shift',
    frequency: 'weekly',
    weekDay: 3, // Quarta-feira
    isRequired: true
  },
  {
    id: 'sdr-5',
    title: 'Agendar reuniões qualificadas',
    description: 'Agendar reuniões para prospects qualificados',
    category: 'Agendamento',
    priority: 'high',
    period: 'end_day',
    frequency: 'daily',
    isRequired: true
  }
];

const directorTasks: Task[] = [
  {
    id: 'dir-1',
    title: 'Revisar desempenho da equipe',
    description: 'Verificar KPIs e progresso da equipe',
    category: 'Gestão',
    priority: 'high',
    period: 'start_day',
    frequency: 'daily',
    isRequired: true
  },
  {
    id: 'dir-2',
    title: 'Sessão de planejamento estratégico',
    description: 'Trabalhar nas iniciativas estratégicas trimestrais',
    category: 'Estratégia',
    priority: 'high',
    period: 'start_shift',
    frequency: 'weekly',
    weekDay: 2, // Terça-feira
    isRequired: true
  },
  {
    id: 'dir-3',
    title: 'Revisão de relacionamento com clientes',
    description: 'Revisar relacionamentos e questões dos principais clientes',
    category: 'Relacionamento com Clientes',
    priority: 'medium',
    period: 'end_shift',
    frequency: 'daily',
    isRequired: true
  },
  {
    id: 'dir-4',
    title: 'Análise orçamentária',
    description: 'Revisar orçamento e despesas departamentais',
    category: 'Finanças',
    priority: 'medium',
    period: 'end_day',
    frequency: 'monthly',
    monthDay: 1, // Todo primeiro dia do mês
    isRequired: false
  },
  {
    id: 'dir-5',
    title: 'Reuniões da equipe',
    description: 'Conduzir reuniões individuais e de equipe',
    category: 'Gestão',
    priority: 'high',
    period: 'start_shift',
    frequency: 'daily',
    isRequired: true
  }
];

export const mockTemplates: ChecklistTemplate[] = [
  {
    id: 'template-secretary',
    name: 'Checklist Diário de Secretária',
    role: 'secretary',
    tasks: secretaryTasks,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'template-nurse',
    name: 'Checklist Diário de Enfermeira',
    role: 'nurse',
    tasks: nurseTasks,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'template-sdr',
    name: 'Checklist Diário de SDR',
    role: 'sdr',
    tasks: sdrTasks,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'template-director',
    name: 'Checklist Diário de Diretor',
    role: 'director',
    tasks: directorTasks,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];