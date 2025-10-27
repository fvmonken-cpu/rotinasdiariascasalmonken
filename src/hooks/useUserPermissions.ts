import { useAuth } from '@/contexts/AuthContext';

export interface UserPermissions {
  canDeletePatients: boolean;
  canViewRemovedPatients: boolean;
  canCreatePatients: boolean;
  canEditPatients: boolean;
  canViewCommercialFields: boolean;
  canEditCommercialFields: boolean;
}

export const useUserPermissions = (): UserPermissions => {
  const { user } = useAuth();

  if (!user) {
    return {
      canDeletePatients: false,
      canViewRemovedPatients: false,
      canCreatePatients: false,
      canEditPatients: false,
      canViewCommercialFields: false,
      canEditCommercialFields: false,
    };
  }

  const isAdmin = user.isAdmin;
  const hasAdminPower = user.has_admin_power;
  const isObstetrician = user.role === 'obstetra';
  const isAdministrative = user.role === 'administrativo';
  const isSuperUser = user.role === 'superusuario';
  const isObstetricNurse = user.role === 'enfermeira_obstetrica';
  const isSDR = user.role === 'sdr';

  console.log('UserPermissions - Dados do usuário:', {
    name: user.name,
    role: user.role,
    isAdmin,
    hasAdminPower,
    isObstetrician,
    isAdministrative,
    isSuperUser,
    isObstetricNurse
  });

  // Usuários que podem ver pacientes removidas:
  // - Admin do sistema (isAdmin = true)
  // - Usuários administrativos
  // - Superusuários
  // - Médico obstetra com poder administrativo
  // - Enfermeiras obstétricas
  // - Usuários SDR
  const canViewRemovedPatients = isAdmin || isAdministrative || isSuperUser || (isObstetrician && hasAdminPower) || isObstetricNurse || isSDR;

  // Usuários que podem deletar pacientes:
  // - Admin do sistema (isAdmin = true)
  // - Usuários administrativos
  // - Superusuários  
  // - Médico obstetra com poder administrativo
  // - Usuários SDR
  // - Usuário que criou a paciente (será verificado por paciente)
  const canDeletePatients = isAdmin || isAdministrative || isSuperUser || (isObstetrician && hasAdminPower) || isSDR;
  
  // Apenas superusuários podem excluir definitivamente do banco de dados
  const canPermanentlyDeletePatients = isSuperUser;

  // Usuários que podem registrar nascimento:
  // - Médicos obstetras (todos podem registrar de suas pacientes)
  // - Superusuários (podem registrar de qualquer paciente)
  // - Usuários administrativos (podem registrar de qualquer paciente)
  const canRegisterBirth = isObstetrician || isSuperUser || isAdministrative;

  // Usuários que podem registrar nascimento de qualquer paciente:
  // - Médicos obstetras com poder administrativo
  // - Superusuários
  // - Usuários administrativos
  const canRegisterAnyBirth = isSuperUser || (isObstetrician && hasAdminPower) || isAdministrative;

  // Usuários que podem ver campos comerciais:
  // - Admin do sistema (isAdmin = true)
  // - Usuários administrativos
  // - Superusuários
  // - Médico obstetra (todos)
  // - Usuários SDR
  const canViewCommercialFields = isAdmin || isAdministrative || isSuperUser || isObstetrician || isSDR;

  // Usuários que podem editar campos comerciais:
  // - Admin do sistema (isAdmin = true)
  // - Usuários administrativos  
  // - Superusuários
  // - Médico obstetra com poder administrativo
  // - Usuários SDR
  const canEditCommercialFields = isAdmin || isAdministrative || isSuperUser || (isObstetrician && hasAdminPower) || isSDR;

  console.log('UserPermissions - Permissões calculadas:', {
    canDeletePatients,
    canViewRemovedPatients,
    canPermanentlyDeletePatients,
    canRegisterBirth,
    canRegisterAnyBirth,
    canViewCommercialFields,
    canEditCommercialFields
  });

  return {
    canDeletePatients,
    canViewRemovedPatients,
    canPermanentlyDeletePatients,
    canRegisterBirth,
    canRegisterAnyBirth,
    canCreatePatients: true, // Todos os usuários logados podem criar
    canEditPatients: true,   // Todos os usuários logados podem editar
    canViewCommercialFields,
    canEditCommercialFields,
  };
};

// Hook para verificar se pode deletar uma paciente específica
export const useCanDeletePatient = (patientCreatedBy?: string): boolean => {
  const { user } = useAuth();
  const permissions = useUserPermissions();

  if (!user) return false;

  // Admin do sistema ou médico com poder administrativo podem deletar qualquer paciente
  if (permissions.canDeletePatients) return true;

  // Usuário que criou a paciente pode deletá-la
  if (patientCreatedBy && user.id === patientCreatedBy) return true;

  return false;
};