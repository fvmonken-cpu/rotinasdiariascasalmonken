export type UserRole = 
  | 'obstetra' 
  | 'enfermeira_obstetrica' 
  | 'doula' 
  | 'pediatra' 
  | 'nutricionista' 
  | 'consultora_amamentacao' 
  | 'sdr'
  | 'administrativo' 
  | 'superusuario';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isAdmin?: boolean;
  hasFullAccess?: boolean; // Para obstetras - acesso total ou apenas suas pacientes
  has_admin_power?: boolean; // Para médicos obstetras com poder administrativo
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  obstetra: 'Obstetra',
  enfermeira_obstetrica: 'Enfermeira Obstétrica',
  doula: 'Doula',
  pediatra: 'Pediatra',
  nutricionista: 'Nutricionista',
  consultora_amamentacao: 'Consultora de Amamentação',
  sdr: 'SDR',
  administrativo: 'Administrativo',
  superusuario: 'Superusuário',
};