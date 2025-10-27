import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, UserRole } from '@/types/user';
import { supabase } from '@/integrations/supabase/client';
interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    canAccessAllPatients: () => boolean;
    canEditPatient: () => boolean;
    canCreatePatient: () => boolean;
    canManageUsers: () => boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children })=>{
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true
    });
    useEffect(()=>{
        const savedUser = localStorage.getItem('casalmonken_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setAuthState({
                    user,
                    isAuthenticated: true,
                    isLoading: false
                });
            } catch (error) {
                console.error('Erro ao carregar usuário salvo:', error);
                localStorage.removeItem('casalmonken_user');
                setAuthState((prev)=>({
                        ...prev,
                        isLoading: false
                    }));
            }
        } else {
            setAuthState((prev)=>({
                    ...prev,
                    isLoading: false
                }));
        }
    }, []);
    const login = async (email: string, password: string): Promise<void> =>{
        console.log('Tentando login com:', email);
        const { data: users, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (error || !users) {
            throw new Error('Usuário não encontrado');
        }
        if (password.length < 3) {
            throw new Error('Senha inválida');
        }
        const user: User = {
            id: users.id,
            name: users.full_name,
            email: users.email,
            role: users.user_type as UserRole,
            isAdmin: users.is_admin,
            hasFullAccess: users.user_type === 'obstetra' || users.user_type === 'administrativo' || users.user_type === 'superusuario',
            has_admin_power: users.has_admin_power,
            createdAt: new Date(users.created_at),
            lastLogin: new Date()
        };
        localStorage.setItem('casalmonken_user', JSON.stringify(user));
        setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
        });
        console.log('Login realizado com sucesso:', user.name);
    };
    const logout = ()=>{
        localStorage.removeItem('casalmonken_user');
        setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
        });
        console.log('Logout realizado');
    };
    const hasPermission = (permission: string): boolean =>{
        if (!authState.user) return false;
        const { role, isAdmin } = authState.user;
        switch(permission){
            case 'view_all_patients':
                return role === 'administrativo' || role === 'superusuario' || (role === 'obstetra' && authState.user.hasFullAccess);
            case 'create_patient':
                return role === 'obstetra';
            case 'edit_patient':
                return role === 'obstetra';
            case 'register_birth':
                return role === 'obstetra';
            case 'manage_users':
                return isAdmin || role === 'superusuario' || role === 'administrativo';
            case 'view_reports':
                return role === 'administrativo' || role === 'superusuario' || role === 'obstetra';
            case 'mark_task':
                return true;
            default:
                return false;
        }
    };
    const canAccessAllPatients = (): boolean =>{
        return hasPermission('view_all_patients');
    };
    const canEditPatient = (): boolean =>{
        return hasPermission('edit_patient');
    };
    const canCreatePatient = (): boolean =>{
        return hasPermission('create_patient');
    };
    const canManageUsers = (): boolean =>{
        return hasPermission('manage_users');
    };
    return (<AuthContext.Provider value={{
        ...authState,
        login,
        logout,
        hasPermission,
        canAccessAllPatients,
        canEditPatient,
        canCreatePatient,
        canManageUsers
    }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = ()=>{
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};
