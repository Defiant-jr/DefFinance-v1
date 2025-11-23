import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
	const { toast } = useToast();

	const [user, setUser] = useState(null);
	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(true);

	const handleSession = useCallback((nextSession) => {
		setSession(nextSession);
		setUser(nextSession?.user ?? null);
		setLoading(false);
	}, []);

	useEffect(() => {
		const loadSession = async () => {
			const {
				data: { session: currentSession },
			} = await supabase.auth.getSession();
			handleSession(currentSession);
		};

		loadSession();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, newSession) => {
			handleSession(newSession);
		});

		return () => subscription.unsubscribe();
	}, [handleSession]);

	const signUp = useCallback(async (email, password, options) => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options,
		});

		if (error) {
			toast({
				variant: 'destructive',
				title: 'Sign up Failed',
				description: error.message || 'Something went wrong',
			});
		}

		return { error };
	}, [toast]);

	const signIn = useCallback(async (email, password) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			toast({
				variant: 'destructive',
				title: 'Sign in Failed',
				description: error.message || 'Something went wrong',
			});
		}

		return { error };
	}, [toast]);

	const signOut = useCallback(async () => {
		const { error } = await supabase.auth.signOut();

		if (error) {
			toast({
				variant: 'destructive',
				title: 'Sign out Failed',
				description: error.message || 'Something went wrong',
			});
		}

		return { error };
	}, [toast]);

	const value = useMemo(
		() => ({
			user,
			session,
			loading,
			signUp,
			signIn,
			signOut,
		}),
		[user, session, loading, signUp, signIn, signOut],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
