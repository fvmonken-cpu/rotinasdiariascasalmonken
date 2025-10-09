import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const mockUsers: User[] = [
    {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        role: 'director'
    },
    {
        id: '2',
        name: 'Mike Chen',
        email: 'mike@company.com',
        role: 'secretary'
    },
    {
        id: '3',
        name: 'Anna Rodriguez',
        email: 'anna@company.com',
        role: 'nurse'
    },
    {
        id: '4',
        name: 'David Kim',
        email: 'david@company.com',
        role: 'sdr'
    },
    {
        id: '5',
        name: 'Admin User',
        email: 'admin@company.com',
        role: 'admin'
    }
];
export const AuthProvider = ({ children }: {
    children: ReactNode;
})=>{
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(()=>{
        console.log('AuthProvider initializing...');
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            console.log('Found saved user:', parsedUser.name);
            setUser(parsedUser);
        } else {
            console.log('No saved user found');
        }
        setIsLoading(false);
        console.log('AuthProvider initialization complete');
    }, []);
    const login = async (email: string, password: string): Promise<boolean> =>{
        setIsLoading(true);
        await new Promise((resolve)=>setTimeout(resolve, 1000));
        const savedUsers = localStorage.getItem('appUsers');
        let usersToCheck = mockUsers;
        if (savedUsers) {
            usersToCheck = [
                ...JSON.parse(savedUsers),
                ...mockUsers.filter((u)=>u.role === 'admin')
            ];
        }
        const foundUser = usersToCheck.find((u)=>u.email === email);
        if (foundUser && password === 'demo123') {
            setUser(foundUser);
            localStorage.setItem('currentUser', JSON.stringify(foundUser));
            setIsLoading(false);
            console.log('User logged in:', foundUser);
            return true;
        }
        setIsLoading(false);
        return false;
    };
    const logout = ()=>{
        setUser(null);
        localStorage.removeItem('currentUser');
    };
    return (<AuthContext.Provider value={{
        user,
        login,
        logout,
        isLoading
    }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = ()=>{
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
