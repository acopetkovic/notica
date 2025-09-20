import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  console.log('🏠 Index re-render - Loading:', loading, 'User:', user?.email || 'none');

  useEffect(() => {
    if (!loading) {
      console.log('🏠 Router decision:', user ? `✅ → /(tabs)` : `❌ → /(auth)`);
      
      // Use setTimeout to ensure navigation happens after render
      setTimeout(() => {
        if (user) {
          console.log('🏠 Navigating to /(tabs)...');
          router.replace('/(tabs)');
        } else {
          console.log('🏠 Navigating to /(auth)...');
          router.replace('/(auth)');
        }
      }, 100);
    }
  }, [user, loading]);

  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>
        {loading ? 'Loading...' : 'Redirecting...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});
