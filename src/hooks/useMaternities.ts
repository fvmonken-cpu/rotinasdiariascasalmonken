import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Maternity {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  state?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateMaternityData {
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  state?: string;
}

export const useMaternities = () => {
  const queryClient = useQueryClient();

  const maternitiesQuery = useQuery({
    queryKey: ['maternities'],
    queryFn: async () => {
      console.log('Buscando maternidades');
      
      const { data, error } = await supabase
        .from('maternities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Erro ao buscar maternidades:', error);
        throw error;
      }

      console.log('Maternidades encontradas:', data.length);
      return data as Maternity[];
    },
  });

  const createMaternityMutation = useMutation({
    mutationFn: async (maternity: CreateMaternityData) => {
      console.log('Criando maternidade:', maternity);
      
      const { data, error } = await supabase
        .from('maternities')
        .insert(maternity)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar maternidade:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maternities'] });
      toast.success('Maternidade cadastrada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro na criação da maternidade:', error);
      toast.error('Erro ao cadastrar maternidade');
    },
  });

  const updateMaternityMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Maternity> & { id: string }) => {
      console.log('Atualizando maternidade:', id, updates);
      
      const { data, error } = await supabase
        .from('maternities')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar maternidade:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maternities'] });
      toast.success('Maternidade atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro na atualização da maternidade:', error);
      toast.error('Erro ao atualizar maternidade');
    },
  });

  const deactivateMaternityMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Desativando maternidade:', id);
      
      const { data, error } = await supabase
        .from('maternities')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao desativar maternidade:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maternities'] });
      queryClient.invalidateQueries({ queryKey: ['all-maternities'] });
      toast.success('Maternidade desativada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao desativar maternidade:', error);
      toast.error('Erro ao desativar maternidade');
    },
  });

  const deleteMaternityMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      console.log('Excluindo maternidade:', id);
      
      // Como não há mais referências FK, a exclusão pode ser direta
      const { error } = await supabase
        .from('maternities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir maternidade:', error);
        throw error;
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maternities'] });
      queryClient.invalidateQueries({ queryKey: ['all-maternities'] });
      toast.success('Maternidade excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir maternidade:', error);
      toast.error('Erro ao excluir maternidade');
    },
  });

  return {
    maternities: maternitiesQuery.data || [],
    isLoading: maternitiesQuery.isLoading,
    error: maternitiesQuery.error,
    refetch: maternitiesQuery.refetch,
    createMaternity: createMaternityMutation.mutate,
    updateMaternity: updateMaternityMutation.mutate,
    deactivateMaternity: deactivateMaternityMutation.mutate,
    deleteMaternity: deleteMaternityMutation.mutate,
    isCreating: createMaternityMutation.isPending,
    isUpdating: updateMaternityMutation.isPending,
    isDeactivating: deactivateMaternityMutation.isPending,
    isDeleting: deleteMaternityMutation.isPending,
  };
};

// Hook para buscar todas as maternidades (incluindo inativas) para admin
export const useAllMaternities = () => {
  return useQuery({
    queryKey: ['all-maternities'],
    queryFn: async () => {
      console.log('Buscando todas as maternidades');
      
      const { data, error } = await supabase
        .from('maternities')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao buscar todas as maternidades:', error);
        throw error;
      }

      console.log('Todas as maternidades encontradas:', data.length);
      return data as Maternity[];
    },
  });
};