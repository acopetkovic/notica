import { appleAuth } from '@invertase/react-native-apple-authentication';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { user, loading, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      // Sign out from Google if user was signed in with Google
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        // User wasn't signed in with Google, ignore this error
        console.log('Google sign out not needed or failed:', googleError);
      }
      
      // Sign out from Firebase using context
      await signOut();
      
      Alert.alert('Success', 'You have been logged out.');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const revokeSignInWithAppleToken = async () => {
    try {
      // Get an authorizationCode from Apple
      const { authorizationCode } = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.REFRESH,
      });

      // Ensure Apple returned an authorizationCode
      if (!authorizationCode) {
        throw new Error('Apple Revocation failed - no authorizationCode returned');
      }

      // Revoke the token
      await auth().revokeToken(authorizationCode);
    } catch (error) {
      console.error('Token revocation error:', error);
      throw error;
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = auth().currentUser;
              
              if (!currentUser) {
                throw new Error('No user is currently signed in');
              }

              // Check the provider and revoke tokens accordingly
              const providerId = currentUser.providerData[0]?.providerId;
              
              if (providerId === 'apple.com') {
                // Revoke Apple Sign-In token
                await revokeSignInWithAppleToken();
              } else if (providerId === 'google.com') {
                // Revoke Google access
                try {
                  await GoogleSignin.revokeAccess();
                } catch (googleError) {
                  console.log('Google revoke access failed:', googleError);
                }
              }
              
              // Delete the user account
              await currentUser.delete();
              
              Alert.alert('Success', 'Your account has been deleted.');
            } catch (error) {
              console.error('Delete Account Error:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    // This should not happen as the root layout handles redirects
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.signedInContainer}>
          <Text style={styles.welcomeText}>Welcome to Notica!</Text>
          <Text style={styles.userInfo}>
            {user.displayName ? `Hello, ${user.displayName}` : 'Hello!'}
          </Text>
          {user.email && (
            <Text style={styles.emailText}>{user.email}</Text>
          )}
          <Text style={styles.providerText}>
            Signed in with {user.providerData[0]?.providerId === 'apple.com' ? 'Apple' : 
                           user.providerData[0]?.providerId === 'google.com' ? 'Google' : 
                           'Unknown Provider'}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  signedInContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  userInfo: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  providerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 40,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  logoutButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
