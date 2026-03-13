import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getProfile } from '../lib/api';
import posthog from 'posthog-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isPro: boolean;
    refreshPro: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isLoading: true,
    isPro: false,
    refreshPro: async () => {},
    signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPro, setIsPro] = useState(() => localStorage.getItem('has_pro_access') === 'true');

    // Keep a ref so visibility handler always sees the latest user
    const userRef = useRef<User | null>(null);
    useEffect(() => { userRef.current = user; }, [user]);

    const refreshPro = useCallback(async (userId?: string, email?: string | null) => {
        const uid = userId ?? userRef.current?.id;
        const em = email ?? userRef.current?.email;
        if (!uid) return;
        const profile = await getProfile(uid, em);
        if (profile) {
            const pro = profile.subscription_status === 'pro';
            setIsPro(pro);
            if (pro) {
                localStorage.setItem('has_pro_access', 'true');
            } else {
                localStorage.removeItem('has_pro_access');
            }
        }
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
            if (session?.user) {
                refreshPro(session.user.id, session.user.email);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
            if (session?.user) {
                refreshPro(session.user.id, session.user.email);
                if (event === 'SIGNED_IN') {
                    posthog.identify(session.user.id, { email: session.user.email });
                }
            } else {
                setIsPro(false);
                posthog.reset();
            }
        });

        return () => subscription.unsubscribe();
    }, [refreshPro]);

    // Re-check Pro status whenever the tab becomes visible
    // Catches the case where user paid in another tab or window
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible' && userRef.current) {
                refreshPro();
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [refreshPro]);

    const signOut = async () => {
        localStorage.removeItem('has_pro_access');
        setIsPro(false);
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, isLoading, isPro, refreshPro, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
