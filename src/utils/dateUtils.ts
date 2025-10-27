import { format, differenceInWeeks, differenceInDays, addWeeks, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const calculateDPP = (dum: Date): Date => {
  // DPP = Data da Última Menstruação + 280 dias (40 semanas)
  return addWeeks(dum, 40);
};

export const calculateGestationalAge = (dpp: Date): { weeks: number; days: number } => {
  // Normalizar as datas para evitar problemas de timezone
  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const dppNormalized = new Date(dpp.getFullYear(), dpp.getMonth(), dpp.getDate());
  const gestationStart = addWeeks(dppNormalized, -40); // 40 semanas antes da DPP
  
  const totalDays = differenceInDays(todayNormalized, gestationStart);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  
  return { weeks: Math.max(0, weeks), days: Math.max(0, days) };
};

export const formatDate = (date: Date): string => {
  if (!isValid(date)) return '';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

export const formatDateTime = (date: Date): string => {
  if (!isValid(date)) return '';
  
  // Converte para o fuso horário de Brasília (UTC-3)
  const brasiliaDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  return format(brasiliaDate, 'dd/MM/yyyy HH:mm', { locale: ptBR });
};

export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1;
  }
  return age;
};

export const formatGestationalAge = (weeks: number, days: number): string => {
  return `${weeks}s ${days}d`;
};

export const getGestationalAgeColor = (weeks: number): string => {
  if (weeks < 37) return 'green'; // Pré-termo
  if (weeks <= 40) return 'yellow'; // A termo
  return 'red'; // Pós-termo
};

// Função para normalizar datas de input para formato do banco
export const normalizeDateForDB = (dateString: string): string => {
  console.log('normalizeDateForDB - Input:', dateString);
  
  // IMPORTANTE: Retorna sempre no formato YYYY-MM-DD exato, sem conversões de timezone
  // Isso garante que o Supabase não faça conversões automáticas
  
  // Se a data já está no formato YYYY-MM-DD, retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.log('normalizeDateForDB - Formato já correto, retornando:', dateString);
    return dateString;
  }
  
  // Para outras strings de data, extrai apenas os componentes numéricos
  const dateMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    const result = `${year}-${month}-${day}`;
    console.log('normalizeDateForDB - Extraído via regex:', result);
    return result;
  }
  
  // Fallback: tentar extrair via Date, mas usar apenas os componentes
  try {
    // Cria a data de forma explícita para evitar timezone issues
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      const result = `${year}-${month}-${day}`;
      console.log('normalizeDateForDB - Extraído via split:', result);
      return result;
    }
  } catch (error) {
    console.log('normalizeDateForDB - Erro no fallback:', error);
  }
  
  console.log('normalizeDateForDB - Não foi possível normalizar, retornando original:', dateString);
  return dateString;
};