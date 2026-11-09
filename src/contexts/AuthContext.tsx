import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

/**
 * staff: full access. dealer: vendor/dealer, own quotations and invoices only.
 * pending: signed up, waiting for staff approval. disabled: access removed.
 */
export type UserRole = 'staff' | 'dealer' | 'pending' | 'disabled';

const ROLES: UserRole[] = ['staff', 'dealer', 'pending', 'disabled'];

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('staff');
  const [sessionLoading, setSessionLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Look up the user's role whenever the logged-in user changes.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      setRole('staff');
      return;
    }
    let active = true;
    setRoleLoading(true);
    supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Could not load user role:', error.message);
        // A user with no profile row predates roles and is treated as staff.
        // Every new sign-up gets a 'pending' row from a database trigger.
        setRole(ROLES.includes(data?.role) ? data!.role as UserRole : 'staff');
        setRoleLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  const loading = sessionLoading || roleLoading;

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
