import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, DatabaseUser, initializeDatabase, authenticateUser, getUser, migrateLocalStorageData } from '@/lib/supabase';
import { toast } from 'sonner';
interface AuthContextType {
    user: DatabaseUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isSupabaseConnected: boolean;
    initializeSupabase: () => Promise<boolean>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
interface AuthProviderProps {
    children: ReactNode;
}
export const SupabaseAuthProvider = ({ children }: AuthProviderProps)=>{
    const [user, setUser] = useState<DatabaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
    const checkSupabaseConnection = async (): Promise<boolean> =>{
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wzlfjrzxzsbsideglexo.supabase.co';
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bGZqcnp4enNic2lkZWdsZXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDE4MTAsImV4cCI6MjA3MzgxNzgxMH0.lmLgmKjCuPkW2EBSQYzx2PkM5Qj42dDXi6ELfahL-Yk';
            console.log('🔍 Checking Supabase credentials...', {
                url: supabaseUrl?.slice(0, 30) + '...',
                keySet: !!supabaseKey,
                envUrl: import.meta.env.VITE_SUPABASE_URL,
                envKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
            });
            if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://your-project.supabase.co' || supabaseKey === 'your-anon-key') {
                console.log('🔧 Supabase not configured yet, using localStorage fallback');
                return false;
            }
            console.log('🔗 Testing database connection...');
            const { data, error } = await supabase.from('users').select('count').limit(1);
            if (error) {
                console.log('⚠️ Supabase connection issue, using localStorage fallback:', error.message);
                console.log('📋 Error details:', error);
                return false;
            }
            console.log('✅ Supabase connected successfully! Data:', data);
            return true;
        } catch (error) {
            console.log('⚠️ Supabase connection failed, using localStorage fallback:', error);
            return false;
        }
    };
    const initializeSupabase = async (): Promise<boolean> =>{
        try {
            console.log('🚀 Initializing Supabase integration...');
            const connected = await checkSupabaseConnection();
            setIsSupabaseConnected(connected);
            if (connected) {
                await initializeDatabase();
                toast.success('🎉 Supabase database initialized successfully!');
                return true;
            } else {
                console.log('📱 Running in localStorage mode');
                return false;
            }
        } catch (error: any) {
            console.error('❌ Failed to initialize Supabase:', error);
            setIsSupabaseConnected(false);
            if (error.message && error.message.includes('Database tables not found')) {
                toast.error('❌ Database tables missing! Please run the SQL setup script in your Supabase dashboard.');
            } else {
                toast.error('Failed to initialize database connection');
            }
            return false;
        }
    };
    const migrateFromLocalStorage = async ()=>{
        console.log('🚫 Migration disabled to prevent data loss');
    };
    const login = async (email: string, password: string): Promise<void> =>{
        setIsLoading(true);
        try {
            if (isSupabaseConnected) {
                console.log('🔑 Using Supabase authentication...');
                const userData = await authenticateUser(email, password);
                setUser(userData);
                localStorage.setItem('supabase_current_user', JSON.stringify(userData));
                console.log('✅ Supabase login successful:', userData.name);
                toast.success(`Bem-vindo(a), ${userData.name}!`);
            } else {
                const mockUsers = [
                    {
                        id: crypto.randomUUID(),
                        name: 'Sarah Johnson',
                        email: 'sarah@company.com',
                        role: 'director' as const
                    },
                    {
                        id: crypto.randomUUID(),
                        name: 'Mike Chen',
                        email: 'mike@company.com',
                        role: 'secretary' as const
                    },
                    {
                        id: crypto.randomUUID(),
                        name: 'Anna Rodriguez',
                        email: 'anna@company.com',
                        role: 'nurse' as const
                    },
                    {
                        id: crypto.randomUUID(),
                        name: 'David Kim',
                        email: 'david@company.com',
                        role: 'sdr' as const
                    },
                    {
                        id: crypto.randomUUID(),
                        name: 'Admin User',
                        email: 'admin@company.com',
                        role: 'admin' as const
                    },
                    {
                        id: crypto.randomUUID(),
                        name: 'Lisa Wang',
                        email: 'lisa@company.com',
                        role: 'secretary' as const
                    },
                    {
                        id: crypto.randomUUID(),
                        name: 'John Smith',
                        email: 'john@company.com',
                        role: 'nurse' as const
                    }
                ];
                const userData = mockUsers.find((u)=>u.email === email);
                if (userData) {
                    const dbUser: DatabaseUser = {
                        ...userData,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    setUser(dbUser);
                    localStorage.setItem('currentUser', JSON.stringify(dbUser));
                    console.log('✅ localStorage login successful:', userData.name);
                    toast.success(`Bem-vindo(a), ${userData.name}!`);
                } else {
                    console.log('❌ User not found in mock data');
                    throw new Error('Credenciais inválidas');
                }
            }
        } catch (error: any) {
            console.error('❌ Login failed:', error);
            console.error('❌ Error type:', typeof error);
            console.error('❌ Error message:', error?.message);
            console.error('❌ Error stack:', error?.stack);
            console.error('❌ Full error object:', JSON.stringify(error, null, 2));
            if (error?.message) {
                throw new Error(error.message);
            } else {
                throw new Error('Falha na autenticação. Verifique suas credenciais.');
            }
        } finally{
            setIsLoading(false);
        }
    };
    const logout = async ()=>{
        try {
            setUser(null);
            if (isSupabaseConnected) {
                await supabase.auth.signOut();
                localStorage.removeItem('supabase_current_user');
                console.log('✅ Supabase logout successful');
            } else {
                localStorage.removeItem('currentUser');
                console.log('✅ localStorage logout successful');
            }
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('❌ Logout failed:', error);
            toast.error('Logout failed');
        }
    };
    useEffect(()=>{
        const initialize = async ()=>{
            console.log('🚀 SupabaseAuthProvider initializing...');
            const connected = await checkSupabaseConnection();
            setIsSupabaseConnected(connected);
            if (connected) {
                await initializeDatabase();
                const savedUser = localStorage.getItem('supabase_current_user');
                if (savedUser) {
                    try {
                        const userData = JSON.parse(savedUser);
                        setUser(userData);
                        console.log('✅ Restored user from localStorage:', userData.name);
                    } catch (error) {
                        console.error('❌ Failed to restore user from localStorage:', error);
                        localStorage.removeItem('supabase_current_user');
                    }
                } else {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user?.email) {
                        try {
                            const userData = await getUser(session.user.email);
                            setUser(userData);
                            localStorage.setItem('supabase_current_user', JSON.stringify(userData));
                            console.log('✅ Restored Supabase session:', userData.name);
                        } catch (error) {
                            console.log('⚠️ Failed to restore Supabase session:', error);
                        }
                    }
                }
            } else {
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    try {
                        const userData = JSON.parse(savedUser);
                        setUser(userData);
                        console.log('✅ Restored localStorage session:', userData.name);
                    } catch (error) {
                        console.error('❌ Failed to restore localStorage session:', error);
                        localStorage.removeItem('currentUser');
                    }
                }
            }
            setIsLoading(false);
            console.log('✅ SupabaseAuthProvider initialization complete');
        };
        initialize();
    }, []);
    useEffect(()=>{
        if (!isSupabaseConnected) return;
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session)=>{
            console.log('🔐 Supabase auth state changed:', event);
            if (event === 'SIGNED_IN' && session?.user?.email) {
                try {
                    const userData = await getUser(session.user.email);
                    setUser(userData);
                } catch (error) {
                    console.error('❌ Failed to get user data:', error);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });
        return ()=>subscription.unsubscribe();
    }, [
        isSupabaseConnected
    ]);
    const value = {
        user,
        isLoading,
        login,
        logout,
        isSupabaseConnected,
        initializeSupabase
    };
    return (<AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>);
};
export const useSupabaseAuth = ()=>{
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
    }
    return context;
};
