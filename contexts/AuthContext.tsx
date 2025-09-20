import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // Get the default app instance
    const authInstance = auth();
    
    const unsubscribe = authInstance.onAuthStateChanged((user) => {
      console.log('🔥 Auth state changed:', user ? `✅ ${user.email}` : '❌ No user');
      setUser(user);
      setLoading(false);
      
      // Navigate based on auth state change (but not on initial load)
      if (!initialLoad) {
        setTimeout(() => {
          if (user) {
            console.log('🔥 User authenticated, navigating to tabs');
            router.replace('/(tabs)');
          } else {
            console.log('🔥 User logged out, navigating to auth');
            router.replace('/(auth)');
          }
        }, 200);
      } else {
        setInitialLoad(false);
      }
    });

    return unsubscribe;
  }, [initialLoad]);

  const signOut = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
