export type PartoVia = 'parto_normal' | 'cesariana' | 'nao_definido';

export interface Address {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero?: string;
  complemento?: string;
}

export interface ServicosContratados {
  consulta_amamentacao: boolean;
  curso_cuidados_recem_nascido: boolean;
  consulta_pediatrica: boolean;
  acompanhamento_nutricional: boolean;
  fisioterapia_pelvica: boolean;
  curso_preparo_parto: boolean; // Condicional - só se via != cesariana
}

export interface TasksJornada {
  curso_preparo_parto: boolean;
  curso_cuidados_recem_nascido: boolean;
  consulta_amamentacao: boolean;
  consulta_pediatrica: boolean;
  acompanhamento_nutricional: boolean;
  fisioterapia_pelvica: boolean;
}

export interface Patient {
  id: string;
  
  // Dados pessoais obrigatórios
  nomeCompleto: string;
  dataNascimento: Date;
  dpp: Date; // Data Provável do Parto
  telefone: string;
  address: Address;
  
  // Dados pessoais opcionais
  nomeCompanheiro?: string;
  nomeBebe?: string;
  
  // Dados obstétricos
  viaPartoEscolhida: PartoVia;
  obstetraResponsavel: 'dr_frederico' | 'dra_natalia';
  
  // Profissionais atribuídos (condicionais)
  enfermeiraObstetrica?: string;
  doula?: string;
  
  // Serviços contratados
  servicosContratados: ServicosContratados;
  
  // Progresso da jornada
  tasksJornada: TasksJornada;
  
  // Dados do nascimento (quando aplicável)
  nascimento?: {
    dataRealNascimento: Date;
    viaPartoRealizada: PartoVia;
    nomeMaternidade: string;
    nomeBebeFinal: string;
  };
  
  // Metadados
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  isPostParto: boolean;
  
  // Dados de remoção (exclusão suave)
  isRemoved: boolean;
  removedAt?: Date;
  removedBy?: string;
  removalReason?: string;
}

export interface PatientHistory {
  id: string;
  patient_id: string;
  user_id: string;
  action_type: 'create' | 'update';
  changed_fields: string[];
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  created_at: string;
  users?: {
    full_name: string;
    user_type: string;
  };
}

export const PARTO_VIA_LABELS: Record<PartoVia, string> = {
  parto_normal: 'Parto Normal',
  cesariana: 'Cesariana',
  nao_definido: 'Ainda Não Definido',
};

export const OBSTETRA_LABELS = {
  dr_frederico: 'Dr. Frederico',
  dra_natalia: 'Dra. Natália',
};