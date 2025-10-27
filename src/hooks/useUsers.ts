import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hook para buscar tipos de usuário
export const useUserTypes = () => {
  return useQuery({
    queryKey: ['user-types'],
    queryFn: async () => {
      console.log('Buscando tipos de usuário...');
      
      const { data, error } = await supabase
        .from('user_types')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) {
        console.error('Erro ao buscar tipos de usuário:', error);
        throw error;
      }

      console.log('Tipos de usuário encontrados:', data.length);
      return data;
    },
  });
};

// Hook para buscar usuários (excluindo superusuários para usuários não-super e usuários excluídos)
export const useUsersManagement = (includeSuperuser: boolean = false) => {
  return useQuery({
    queryKey: ['users-management', includeSuperuser],
    queryFn: async () => {
      console.log('Buscando usuários para gerenciamento...');
      
      let query = supabase
        .from('users')
        .select(`
          *,
          user_type_info:user_types!users_user_type_fkey(*)
        `)
        .is('deleted_at', null) // Filtrar usuários não excluídos
        .order('full_name');

      // Se não deve incluir superusuário, filtrar
      if (!includeSuperuser) {
        query = query.eq('is_superuser', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }

      console.log('Usuários encontrados:', data.length);
      return data;
    },
  });
};

// Hook para buscar todos os tipos de usuário (incluindo inativos para gerenciamento)
export const useAllUserTypes = (includeSuperuserType: boolean = false) => {
  return useQuery({
    queryKey: ['all-user-types', includeSuperuserType],
    queryFn: async () => {
      console.log('Buscando todos os tipos de usuário...');
      
      let query = supabase
        .from('user_types')
        .select('*')
        .order('display_name');

      // Se não deve incluir tipo superusuario, filtrar
      if (!includeSuperuserType) {
        query = query.neq('name', 'superusuario');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar tipos de usuário:', error);
        throw error;
      }

      console.log('Todos os tipos de usuário encontrados:', data.length);
      return data;
    },
  });
};

// Hook para criar usuário - Updated after database constraint fix for SDR user type
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      email: string;
      full_name: string;
      display_name: string;
      password: string;
      user_type: string;
      is_admin: boolean;
    }) => {
      console.log('Criando usuário:', userData.email);

      // Hash da senha (em produção, usar bcrypt no backend)
      const password_hash = btoa(userData.password); // Temporário - usar hash real

      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          full_name: userData.full_name,
          display_name: userData.display_name,
          password_hash: password_hash,
          user_type: userData.user_type,
          is_admin: userData.is_admin,
          is_superuser: false, // Nunca criar superusuário via interface
          is_active: true, // Sempre criar usuário ativo
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar usuário:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na criação do usuário:', error);
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('email')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error('Dados duplicados encontrados');
        }
      } else {
        toast.error('Erro ao criar usuário');
      }
    },
  });
};

// Hook para editar usuário
export const useEditUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      id: string;
      email?: string;
      full_name?: string;
      display_name?: string;
      username?: string;
      password?: string;
      user_type?: string;
      is_admin?: boolean;
      is_superuser?: boolean;
    }) => {
      console.log('Editando usuário:', userData.id);

      const updateData: any = { ...userData };
      delete updateData.id;

      // Se tem nova senha, fazer hash
      if (userData.password) {
        updateData.password_hash = btoa(userData.password); // Temporário - usar hash real
        delete updateData.password;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userData.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao editar usuário:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na edição do usuário:', error);
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('username')) {
          toast.error('Este nome de usuário já existe');
        } else if (error.message.includes('email')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error('Dados duplicados encontrados');
        }
      } else {
        toast.error('Erro ao atualizar usuário');
      }
    },
  });
};

// Hook para excluir usuário (exclusão suave)
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, currentUserId }: { userId: string; currentUserId: string }) => {
      console.log('Excluindo usuário (soft delete):', userId);

      // Chamar a função de exclusão suave
      const { error } = await supabase.rpc('soft_delete_user', {
        user_id: userId,
        deleted_by_user_id: currentUserId
      });

      if (error) {
        console.error('Erro ao excluir usuário:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário excluído com sucesso! Associações com pacientes ativas foram removidas.');
    },
    onError: (error) => {
      console.error('Erro na exclusão do usuário:', error);
      toast.error('Erro ao excluir usuário');
    },
  });
};

// Hook para criar tipo de usuário
export const useCreateUserType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (typeData: {
      name: string;
      display_name: string;
      description?: string;
    }) => {
      console.log('Criando tipo de usuário:', typeData.name);

      const { data, error } = await supabase
        .from('user_types')
        .insert(typeData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar tipo de usuário:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-types'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-types'] });
      toast.success('Tipo de usuário criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na criação do tipo:', error);
      if (error.code === '23505') { // Unique constraint violation
        toast.error('Este nome de tipo já existe');
      } else {
        toast.error('Erro ao criar tipo de usuário');
      }
    },
  });
};

// Hook para editar tipo de usuário
export const useEditUserType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (typeData: {
      id: string;
      name?: string;
      display_name?: string;
      description?: string;
      is_active?: boolean;
    }) => {
      console.log('Editando tipo de usuário:', typeData.id);

      const updateData = { ...typeData };
      delete updateData.id;

      const { data, error } = await supabase
        .from('user_types')
        .update(updateData)
        .eq('id', typeData.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao editar tipo de usuário:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-types'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-types'] });
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      toast.success('Tipo de usuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na edição do tipo:', error);
      if (error.code === '23505') { // Unique constraint violation
        toast.error('Este nome de tipo já existe');
      } else {
        toast.error('Erro ao atualizar tipo de usuário');
      }
    },
  });
};

// Hook para alternar status ativo/inativo do usuário
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      console.log('Alterando status do usuário:', userId, 'para', isActive ? 'ativo' : 'inativo');

      const { data, error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao alterar status do usuário:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      queryClient.invalidateQueries({ queryKey: ['users'] }); // Invalida também os hooks de seleção de profissionais
      const status = data.is_active ? 'ativado' : 'inativado';
      toast.success(`Usuário ${status} com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário');
    },
  });
};

// Hook para resetar senha do usuário
export const useResetUserPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('Resetando senha do usuário:', userId);

      // Senha padrão "mudar1234!"
      const defaultPassword = 'mudar1234!';
      const password_hash = btoa(defaultPassword); // Temporário - usar hash real

      const { data, error } = await supabase
        .from('users')
        .update({ password_hash })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao resetar senha:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      toast.success('Senha resetada para "mudar1234!" com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao resetar senha:', error);
      toast.error('Erro ao resetar senha do usuário');
    },
  });
};

// Hook para alternar privilégios administrativos do usuário
export const useToggleAdminPrivileges = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      console.log(`Alterando privilégios administrativos do usuário: ${userId} para ${isAdmin ? 'admin' : 'usuário comum'}`);

      const { data, error } = await supabase
        .from('users')
        .update({ is_admin: isAdmin })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao alterar privilégios administrativos:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, { isAdmin }) => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      toast.success(`Privilégios administrativos ${isAdmin ? 'concedidos' : 'removidos'} com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao alterar privilégios administrativos:', error);
      toast.error('Erro ao alterar privilégios administrativos');
    },
  });
};