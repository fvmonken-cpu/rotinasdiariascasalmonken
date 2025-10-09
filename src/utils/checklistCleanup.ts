import { DailyChecklist } from '@/types';

/**
 * Limpa checklists finalizados de dias anteriores
 * Mantém apenas checklists do dia atual
 */
export const cleanupOldChecklists = (): void => {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const savedChecklists = localStorage.getItem('dailyChecklists');
    if (!savedChecklists) return;
    
    const allChecklists: DailyChecklist[] = JSON.parse(savedChecklists);
    const todayChecklists = allChecklists.filter(checklist => checklist.date === today);
    
    // Se houve mudança (removeu checklists antigos)
    if (todayChecklists.length !== allChecklists.length) {
      localStorage.setItem('dailyChecklists', JSON.stringify(todayChecklists));
      console.log(`Cleaned up ${allChecklists.length - todayChecklists.length} old checklists. Kept ${todayChecklists.length} from today.`);
    }
  } catch (error) {
    console.error('Error cleaning up old checklists:', error);
  }
};

/**
 * Verifica se houve mudança de dia e limpa checklists antigos
 * Armazena a última data verificada no localStorage
 */
export const checkAndCleanupChecklists = (): void => {
  const today = new Date().toISOString().split('T')[0];
  const lastCleanupDate = localStorage.getItem('lastChecklistCleanup');
  
  // Se é um novo dia ou primeira execução
  if (lastCleanupDate !== today) {
    console.log('New day detected, cleaning up old checklists...');
    cleanupOldChecklists();
    localStorage.setItem('lastChecklistCleanup', today);
  }
};