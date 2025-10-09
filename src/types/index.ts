export interface User {
  id: string;
  name: string;
  email: string;
  role: 'secretary' | 'nurse' | 'sdr' | 'director' | 'admin';
  avatar?: string;
}

// Nova interface para categorias de tarefas
export interface TaskCategory {
  id: string;
  name: string;
  description?: string;
  color: string; // Cor para identificação visual
  createdAt: string;
  updatedAt: string;
}

// Nova interface para categorias profissionais
export interface ProfessionalCategory {
  id: string;
  name: string;
  description?: string;
  roleKey: string; // Chave única para referenciar no código (ex: 'secretary', 'nurse')
  color: string; // Cor para identificação visual
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  categoryId: string; // Referência para TaskCategory
  priority: 'low' | 'medium' | 'high';
  isRequired: boolean;
  period: 'start_day' | 'start_shift' | 'end_shift' | 'end_day';
  periods?: ('start_day' | 'start_shift' | 'end_shift' | 'end_day')[]; // Multiple periods support
  frequency: 'daily' | 'weekly' | 'monthly';
  weekDay?: number; // Para tarefas semanais (0=domingo, 1=segunda, etc.)
  monthDay?: number; // Para tarefas mensais (1-31)
  assignedProfessions: string[]; // IDs das categorias profissionais que podem executar esta tarefa
  createdAt: string;
  updatedAt: string;

}

export interface ChecklistTemplate {
  id: string;
  name: string;
  role: User['role'];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskProgress {
  id: string;
  taskId: string;
  userId: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  date: string; // YYYY-MM-DD format
}

export interface DailyChecklist {
  id: string;
  userId: string;
  templateId: string;
  date: string;
  period: 'start_day' | 'start_shift' | 'end_shift' | 'end_day';
  shift?: 'morning' | 'afternoon'; // Para turnos específicos
  progress: TaskProgress[];
  completionRate: number;
  startedAt?: string;
  completedAt?: string;
  isFinalized?: boolean; // Para impedir alterações após finalização
  finalizedAt?: string; // Quando foi finalizado pelo usuário
  finalReport?: string; // Relatório final gerado
  reopenReason?: string; // Motivo para reabrir o checklist
  reopenedAt?: string; // Quando foi reaberto
  reopenCount?: number; // Número de vezes que foi reaberto
}

// Novo tipo para relatórios
export interface UserReport {
  user: User;
  loginDate: string;
  checklists: DailyChecklist[];
}

// Novo tipo para seleção de período
export interface ChecklistPeriod {
  id: string;
  name: string;
  description: string;
  period: 'start_day' | 'start_shift' | 'end_shift' | 'end_day';
  shift?: 'morning' | 'afternoon';
}