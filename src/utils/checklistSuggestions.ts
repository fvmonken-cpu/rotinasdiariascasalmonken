import { ChecklistPeriod } from '@/types';

/**
 * Sugere o período do checklist baseado no horário atual
 */
export const suggestChecklistPeriod = (): ChecklistPeriod => {
  const now = new Date();
  const hours = now.getHours();

  // Período baseado no horário
  if (hours >= 6 && hours < 12) {
    // 6:00 - 12:00: Início do dia (inclui início de turno manhã)
    return {
      id: 'start-day-suggestion',
      name: 'Início do Dia',
      description: 'Tarefas para começar o dia de trabalho (inclui início de turno manhã)',
      period: 'start_day'
    };
  } else if (hours >= 12 && hours < 14) {
    // 12:00 - 14:00: Final do turno da manhã
    return {
      id: 'end-shift-morning-suggestion',
      name: 'Final do Turno - Manhã',
      description: 'Tarefas para finalizar o turno da manhã',
      period: 'end_shift',
      shift: 'morning'
    };
  } else if (hours >= 14 && hours < 17) {
    // 14:00 - 17:00: Início do turno da tarde
    return {
      id: 'start-shift-afternoon-suggestion',
      name: 'Início do Turno - Tarde',
      description: 'Tarefas específicas para o início do turno da tarde',
      period: 'start_shift',
      shift: 'afternoon'
    };
  } else {
    // 17:00 - 6:00: Final do dia (inclui final de turno tarde)
    return {
      id: 'end-day-suggestion',
      name: 'Final do Dia',
      description: 'Tarefas para encerrar o dia de trabalho (inclui final de turno tarde)',
      period: 'end_day'
    };
  }
};

/**
 * Retorna uma mensagem explicativa sobre a sugestão
 */
export const getSuggestionMessage = (): string => {
  const now = new Date();
  const hours = now.getHours();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (hours >= 6 && hours < 12) {
    return `Com base no horário atual (${timeStr}), sugerimos o checklist de "Início do Dia" para começar suas atividades.`;
  } else if (hours >= 12 && hours < 14) {
    return `Com base no horário atual (${timeStr}), sugerimos o checklist de "Final do Turno da Manhã".`;
  } else if (hours >= 14 && hours < 17) {
    return `Com base no horário atual (${timeStr}), sugerimos o checklist de "Início do Turno da Tarde".`;
  } else {
    return `Com base no horário atual (${timeStr}), sugerimos o checklist de "Final do Dia" para encerrar suas atividades.`;
  }
};