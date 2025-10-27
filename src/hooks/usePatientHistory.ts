import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PatientHistory } from '@/types/patient';

export const usePatientHistory = (patientId: string | null) => {
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = async () => {
    if (!patientId) {
      setHistory([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First, try to get basic history data
      const { data, error: fetchError } = await supabase
        .from('patient_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
        
      console.log('Histórico bruto:', data, fetchError);

      if (fetchError) {
        throw fetchError;
      }

      setHistory(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createHistoryEntry = async (
    patientId: string,
    actionType: 'create' | 'update',
    changedFields: string[],
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    userId: string,
    userName: string,
    userType: string
  ) => {
    try {
      if (!userId) {
        throw new Error('User ID é obrigatório para criar histórico');
      }

      // Log the data being inserted for debugging
      const historyData = {
        patient_id: patientId,
        user_id: userId,
        action_type: actionType,
        changed_fields: changedFields,
        old_values: oldValues,
        new_values: {
          ...newValues,
          _user_name: userName,
          _user_type: userType
        }
      };
      
      console.log('Inserindo histórico:', historyData);

      const { error } = await supabase
        .from('patient_history')
        .insert(historyData);

      if (error) {
        console.error('Erro do Supabase ao inserir histórico:', error);
        throw error;
      }

      console.log('Histórico criado com sucesso');
      
      // Refresh history after creating new entry
      await fetchHistory();
    } catch (err) {
      console.error('Erro ao criar entrada no histórico:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
    createHistoryEntry
  };
};