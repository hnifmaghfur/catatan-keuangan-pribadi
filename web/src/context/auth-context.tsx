'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseAuthUser, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  phone_number: string;
  name: string;
  monthly_budget: number;
  budget_start_day: number;
}

interface AuthContextType {
  authUser: SupabaseAuthUser | null;
  profile: UserProfile | null;
  phone: string | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    pass: string,
    phoneNumber: string,
    name: string
  ) => Promise<{ error?: string }>;
  signInWithPhoneQuick: (phoneNumber: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load saved phone from localStorage for phone-based access
  useEffect(() => {
    const savedPhone = localStorage.getItem('keuangan_phone');
    if (savedPhone) {
      setPhone(savedPhone);
    }
  }, []);

  const fetchProfileByPhone = async (phoneNumber: string) => {
    try {
      const res = await fetch(`/api/summary?phone=${encodeURIComponent(phoneNumber)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setProfile(data.user);
          setPhone(data.user.phone_number);
          localStorage.setItem('keuangan_phone', data.user.phone_number);
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile by phone:', err);
    }
  };

  const fetchProfileById = async (userId: string, userMetaPhone?: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile(data);
        setPhone(data.phone_number);
        localStorage.setItem('keuangan_phone', data.phone_number);
        return;
      }

      // Fallback by phone number in metadata if id query didn't find record yet
      if (userMetaPhone) {
        await fetchProfileByPhone(userMetaPhone);
      }
    } catch (err) {
      console.error('Failed to fetch profile by id:', err);
    }
  };

  useEffect(() => {
    // 1. Check existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileById(session.user.id, session.user.user_metadata?.phone_number);
      } else {
        const savedPhone = localStorage.getItem('keuangan_phone');
        if (savedPhone) {
          fetchProfileByPhone(savedPhone);
        }
      }
      setLoading(false);
    });

    // 2. Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfileById(session.user.id, session.user.user_metadata?.phone_number);
      } else {
        const savedPhone = localStorage.getItem('keuangan_phone');
        if (savedPhone) {
          await fetchProfileByPhone(savedPhone);
        } else {
          setProfile(null);
          setPhone(null);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        await fetchProfileById(data.user.id, data.user.user_metadata?.phone_number);
      }

      return {};
    } catch (err: any) {
      return { error: err?.message || 'Login failed' };
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    rawPhoneNumber: string,
    name: string
  ) => {
    try {
      // Normalize phone number (e.g. 0812... -> 62812...)
      let cleanedPhone = rawPhoneNumber.replace(/\D/g, '');
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = '62' + cleanedPhone.slice(1);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            phone_number: cleanedPhone,
            name: name || `User ${cleanedPhone.slice(-4)}`,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // Link/ensure user in public.users table
      if (data.user) {
        await fetch('/api/budget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanedPhone,
            name: name || `User ${cleanedPhone.slice(-4)}`,
          }),
        });

        localStorage.setItem('keuangan_phone', cleanedPhone);
        setPhone(cleanedPhone);
        await fetchProfileByPhone(cleanedPhone);
      }

      return {};
    } catch (err: any) {
      return { error: err?.message || 'Registration failed' };
    }
  };

  const signInWithPhoneQuick = async (rawPhoneNumber: string) => {
    try {
      let cleanedPhone = rawPhoneNumber.replace(/\D/g, '');
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = '62' + cleanedPhone.slice(1);
      }

      if (!cleanedPhone || cleanedPhone.length < 9) {
        return { error: 'Nomor WhatsApp tidak valid (minimal 9 digit)' };
      }

      localStorage.setItem('keuangan_phone', cleanedPhone);
      setPhone(cleanedPhone);
      await fetchProfileByPhone(cleanedPhone);
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Gagal masuk dengan nomor HP' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('keuangan_phone');
    setAuthUser(null);
    setProfile(null);
    setPhone(null);
  };

  const refreshProfile = async () => {
    if (phone) {
      await fetchProfileByPhone(phone);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        profile,
        phone,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithPhoneQuick,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
