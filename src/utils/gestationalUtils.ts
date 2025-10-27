/**
 * Funções utilitárias para cálculos gestacionais
 */

export interface GestationalWeekDates {
  weeks_20_date: Date;
  weeks_30_date: Date;
  weeks_32_date: Date;
  weeks_36_date: Date;
}

/**
 * Calcula as datas das semanas gestacionais baseado na DPP
 * DPP = 40 semanas de gestação
 */
export const calculateGestationalWeekDates = (dpp: Date): GestationalWeekDates => {
  const dppDate = new Date(dpp);
  
  // DPP é 40 semanas, então:
  // 20 semanas = DPP - 20 semanas (140 dias)
  // 30 semanas = DPP - 10 semanas (70 dias) 
  // 32 semanas = DPP - 8 semanas (56 dias)
  // 36 semanas = DPP - 4 semanas (28 dias)
  
  const weeks_20_date = new Date(dppDate);
  weeks_20_date.setDate(dppDate.getDate() - (20 * 7)); // 140 dias atrás
  
  const weeks_30_date = new Date(dppDate);
  weeks_30_date.setDate(dppDate.getDate() - (10 * 7)); // 70 dias atrás
  
  const weeks_32_date = new Date(dppDate);
  weeks_32_date.setDate(dppDate.getDate() - (8 * 7)); // 56 dias atrás
  
  const weeks_36_date = new Date(dppDate);
  weeks_36_date.setDate(dppDate.getDate() - (4 * 7)); // 28 dias atrás
  
  return {
    weeks_20_date,
    weeks_30_date,
    weeks_32_date,
    weeks_36_date
  };
};

/**
 * Verifica se o usuário tem permissão para ver campos comerciais
 */
export const canViewCommercialFields = (userType: string): boolean => {
  const allowedTypes = ['superusuario', 'administrativo', 'obstetra', 'sdr'];
  return allowedTypes.includes(userType);
};

/**
 * Formata as datas das semanas gestacionais para exibição
 */
export const formatGestationalWeekDate = (date: Date | string | null, weekNumber: number): string => {
  console.log(`formatGestationalWeekDate - Input: ${date}, Week: ${weekNumber}`);
  
  if (!date) {
    console.log(`formatGestationalWeekDate - Date is null/undefined for week ${weekNumber}`);
    return '-';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  console.log(`formatGestationalWeekDate - Date object created: ${dateObj}`);
  
  const today = new Date();
  
  const formattedDate = dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
  
  if (dateObj <= today) {
    return `${formattedDate} (completou)`;
  } else {
    return `${formattedDate} (completará)`;
  }
};

/**
 * Retorna o label da semana gestacional
 */
export const getGestationalWeekLabel = (weekNumber: number): string => {
  const labels = {
    20: '20 semanas',
    30: '30 semanas', 
    32: '32 semanas',
    36: '36 semanas'
  };
  
  return labels[weekNumber] || `${weekNumber} semanas`;
};