import { Task, ChecklistPeriod } from '@/types';

/**
 * Verifica se uma tarefa deve ser incluída no checklist baseada na sua frequência
 * Inclui lógica de reagendamento automático para dias sem expediente
 */
export const shouldIncludeTask = (
  task: Task, 
  date: Date, 
  userId: string, 
  checklistHistory: any[] = []
): boolean => {
  const today = new Date(date);
  
  switch (task.frequency) {
    case 'daily':
      return true; // Tarefas diárias sempre são incluídas
      
    case 'weekly':
      if (task.weekDay === undefined) return false;
      
      // Verifica se é o dia original da tarefa
      if (today.getDay() === task.weekDay) {
        return true;
      }
      
      // Lógica de reagendamento: se passou do dia original e não foi feita na semana
      return shouldRescheduleWeeklyTask(task, today, userId, checklistHistory);
      
    case 'monthly':
      if (task.monthDay === undefined) return false;
      
      // Verifica se é o dia original da tarefa
      if (today.getDate() === task.monthDay) {
        return true;
      }
      
      // Lógica de reagendamento: se passou do dia original e não foi feita no mês
      return shouldRescheduleMonthlyTask(task, today, userId, checklistHistory);
      
    default:
      return true;
  }
};

/**
 * Verifica se uma tarefa semanal deve ser reagendada para hoje
 */
const shouldRescheduleWeeklyTask = (
  task: Task,
  today: Date,
  userId: string,
  checklistHistory: any[]
): boolean => {
  if (task.weekDay === undefined) return false;
  
  // Calcula o início da semana atual
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Data original da tarefa nesta semana
  const originalTaskDate = new Date(startOfWeek);
  originalTaskDate.setDate(startOfWeek.getDate() + task.weekDay);
  
  // Se ainda não passou do dia original, não reagenda
  if (today < originalTaskDate) {
    return false;
  }
  
  // Verifica se já foi completada nesta semana
  if (hasCompletedTaskInPeriod(task, today, userId, checklistHistory)) {
    return false;
  }
  
  // Verifica se houve checklist no dia original
  const originalDateStr = originalTaskDate.toISOString().split('T')[0];
  const hasChecklistOnOriginalDate = checklistHistory.some(checklist => 
    checklist.userId === userId && checklist.date === originalDateStr
  );
  
  // Se não houve checklist no dia original, reagenda para hoje
  return !hasChecklistOnOriginalDate;
};

/**
 * Verifica se uma tarefa mensal deve ser reagendada para hoje
 */
const shouldRescheduleMonthlyTask = (
  task: Task,
  today: Date,
  userId: string,
  checklistHistory: any[]
): boolean => {
  if (task.monthDay === undefined) return false;
  
  // Data original da tarefa neste mês
  const originalTaskDate = new Date(today.getFullYear(), today.getMonth(), task.monthDay);
  
  // Se ainda não passou do dia original, não reagenda
  if (today < originalTaskDate) {
    return false;
  }
  
  // Verifica se já foi completada neste mês
  if (hasCompletedTaskInPeriod(task, today, userId, checklistHistory)) {
    return false;
  }
  
  // Verifica se houve checklist no dia original
  const originalDateStr = originalTaskDate.toISOString().split('T')[0];
  const hasChecklistOnOriginalDate = checklistHistory.some(checklist => 
    checklist.userId === userId && checklist.date === originalDateStr
  );
  
  // Se não houve checklist no dia original, reagenda para hoje
  return !hasChecklistOnOriginalDate;
};

/**
 * Filtra tarefas de um template baseado no período e frequência
 * Inclui lógica de reagendamento automático
 */
export const filterTasksByPeriodAndFrequency = (
  tasks: Task[], 
  period: ChecklistPeriod, 
  date: Date, 
  userId: string,
  checklistHistory: any[] = []
): Task[] => {
  return tasks.filter(task => {
    // Primeiro, verifica se a tarefa pertence ao período correto
    let belongsToPeriod = false;
    
    // Get all periods this task should appear in (support for multiple periods)
    const taskPeriods = task.periods || [task.period];
    
    if (period.period === 'start_day') {
      // "Início do Dia" inclui tarefas start_day e start_shift (manhã)
      belongsToPeriod = taskPeriods.includes('start_day') || 
                        (taskPeriods.includes('start_shift') && !period.shift);
    } else if (period.period === 'end_day') {
      // "Final do Dia" inclui tarefas end_day e end_shift (tarde)
      belongsToPeriod = taskPeriods.includes('end_day') || 
                        (taskPeriods.includes('end_shift') && !period.shift);
    } else if (period.period === 'start_shift' && period.shift) {
      // "Início do Turno - Tarde" inclui apenas start_shift com shift específico
      belongsToPeriod = taskPeriods.includes('start_shift');
    } else if (period.period === 'end_shift' && period.shift) {
      // "Final do Turno - Manhã" inclui apenas end_shift com shift específico
      belongsToPeriod = taskPeriods.includes('end_shift');
    } else {
      belongsToPeriod = taskPeriods.includes(period.period);
    }
    
    if (!belongsToPeriod) return false;
    
    // Depois, verifica se deve ser incluída baseada na frequência (com reagendamento)
    return shouldIncludeTask(task, date, userId, checklistHistory);
  });
};

/**
 * Verifica se já existe um checklist da mesma frequência no período
 */
export const hasCompletedTaskInPeriod = (
  task: Task, 
  date: Date, 
  userId: string,
  checklistHistory: any[]
): boolean => {
  const today = new Date(date);
  
  switch (task.frequency) {
    case 'daily':
      // Para tarefas diárias, verifica apenas o dia atual
      return checklistHistory.some(checklist => 
        checklist.userId === userId &&
        checklist.date === today.toISOString().split('T')[0] &&
        checklist.progress.some((progress: any) => 
          progress.taskId === task.id && progress.completed
        )
      );
      
    case 'weekly':
      // Para tarefas semanais, verifica se foi completada nesta semana
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return checklistHistory.some(checklist => {
        const checklistDate = new Date(checklist.date);
        return checklist.userId === userId &&
          checklistDate >= startOfWeek &&
          checklistDate <= endOfWeek &&
          checklist.progress.some((progress: any) => 
            progress.taskId === task.id && progress.completed
          );
      });
      
    case 'monthly':
      // Para tarefas mensais, verifica se foi completada neste mês
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      return checklistHistory.some(checklist => {
        const checklistDate = new Date(checklist.date);
        return checklist.userId === userId &&
          checklistDate >= startOfMonth &&
          checklistDate <= endOfMonth &&
          checklist.progress.some((progress: any) => 
            progress.taskId === task.id && progress.completed
          );
      });
      
    default:
      return false;
  }
};

/**
 * Obtém o rótulo de frequência para exibição
 */
export const getFrequencyLabel = (task: Task): string => {
  switch (task.frequency) {
    case 'daily':
      return 'Diário';
    case 'weekly':
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      return `Semanal (${days[task.weekDay || 0]})`;
    case 'monthly':
      return `Mensal (dia ${task.monthDay || 1})`;
    default:
      return task.frequency;
  }
};

/**
 * Obtém próxima data em que a tarefa deve ser executada
 */
export const getNextTaskDate = (task: Task, fromDate: Date = new Date()): Date => {
  const today = new Date(fromDate);
  
  switch (task.frequency) {
    case 'daily':
      return today;
      
    case 'weekly':
      if (task.weekDay === undefined) return today;
      
      const targetDay = task.weekDay;
      const currentDay = today.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
      return nextDate;
      
    case 'monthly':
      if (task.monthDay === undefined) return today;
      
      const nextMonth = new Date(today);
      nextMonth.setDate(task.monthDay);
      
      if (nextMonth <= today) {
        nextMonth.setMonth(nextMonth.getMonth() + 1);
      }
      
      return nextMonth;
      
    default:
      return today;
  }
};

/**
 * Verifica se uma tarefa está "atrasada" (deveria ter sido feita mas não foi)
 */
export const isTaskOverdue = (task: Task, date: Date, userId: string, checklistHistory: any[]): boolean => {
  const today = new Date(date);
  const nextTaskDate = getNextTaskDate(task, today);
  
  // Se a próxima data é hoje ou no futuro, não está atrasada
  if (nextTaskDate >= today) {
    return false;
  }
  
  // Verifica se foi completada no período correto
  return !hasCompletedTaskInPeriod(task, nextTaskDate, userId, checklistHistory);
};

/**
 * Verifica se uma tarefa foi reagendada e retorna informações sobre o reagendamento
 */
export const getTaskRescheduleInfo = (
  task: Task,
  date: Date,
  userId: string,
  checklistHistory: any[]
): { isRescheduled: boolean; originalDate?: Date; reason?: string } => {
  const today = new Date(date);
  
  switch (task.frequency) {
    case 'weekly':
      if (task.weekDay === undefined) return { isRescheduled: false };
      
      // Se hoje é o dia original, não foi reagendada
      if (today.getDay() === task.weekDay) {
        return { isRescheduled: false };
      }
      
      // Verifica se foi reagendada
      if (shouldRescheduleWeeklyTask(task, today, userId, checklistHistory)) {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const originalDate = new Date(startOfWeek);
        originalDate.setDate(startOfWeek.getDate() + task.weekDay);
        
        const dayNames = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
        
        return {
          isRescheduled: true,
          originalDate,
          reason: `Reagendada de ${dayNames[task.weekDay]} (${originalDate.toLocaleDateString('pt-BR')}) - sem expediente no dia original`
        };
      }
      break;
      
    case 'monthly':
      if (task.monthDay === undefined) return { isRescheduled: false };
      
      // Se hoje é o dia original, não foi reagendada
      if (today.getDate() === task.monthDay) {
        return { isRescheduled: false };
      }
      
      // Verifica se foi reagendada
      if (shouldRescheduleMonthlyTask(task, today, userId, checklistHistory)) {
        const originalDate = new Date(today.getFullYear(), today.getMonth(), task.monthDay);
        
        return {
          isRescheduled: true,
          originalDate,
          reason: `Reagendada do dia ${task.monthDay} (${originalDate.toLocaleDateString('pt-BR')}) - sem expediente no dia original`
        };
      }
      break;
  }
  
  return { isRescheduled: false };
};