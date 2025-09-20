import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import auth, { AppleAuthProvider, deleteUser, getAuth, GoogleAuthProvider, signInWithCredential, signOut } from '@react-native-firebase/auth';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  // Configure Google Sign-In and listen for authentication state changes
  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: '850162394411-vsjq80mlnqjfoftfevqtni2bb9ratl3d.apps.googleusercontent.com', // From GoogleService-Info.plist
      offlineAccess: false,
    });

    // Listen for authentication state to change
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe; // unsubscribe on unmount
  }, []);

  const onAppleButtonPress = async () => {
    try {
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        // As per the FAQ of react-native-apple-authentication, the name should come first in the following array.
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = AppleAuthProvider.credential(identityToken, nonce);

      // Sign the user in with the credential
      await signInWithCredential(getAuth(), appleCredential);
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      Alert.alert('Sign-In Error', 'Failed to sign in with Apple. Please try again.');
    }
  };

  const onGoogleButtonPress = async () => {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const response = await GoogleSignin.signIn();
      
      if (response.type === 'success') {
        const { data } = response;
        
        // Create a Google credential with the token
        const googleCredential = GoogleAuthProvider.credential(data.idToken);

        // Sign-in the user with the credential
        await signInWithCredential(getAuth(), googleCredential);
      } else {
        // User cancelled the sign-in
        console.log('Google Sign-In cancelled');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
        console.log('User cancelled Google Sign-In');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation (sign-in) is in progress already
        Alert.alert('Sign-In In Progress', 'Google Sign-In is already in progress.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        Alert.alert('Play Services Error', 'Google Play Services not available or outdated.');
      } else {
        // Some other error happened
        Alert.alert('Sign-In Error', 'Failed to sign in with Google. Please try again.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(getAuth());
      
      // Sign out from Google if user was signed in with Google
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        // User wasn't signed in with Google, ignore this error
        console.log('Google sign out not needed or failed:', googleError);
      }
      
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
              const auth = getAuth();
              const currentUser = auth.currentUser;
              
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
              await deleteUser(currentUser);
              
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
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {user ? (
          // User is signed in
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
        ) : (
          // User is not signed in
          <View style={styles.signInContainer}>
            <Text style={styles.titleText}>Welcome to Notica</Text>
            <Text style={styles.subtitleText}>Sign in to continue</Text>
            
            <View style={styles.signInButtonsContainer}>
              {Platform.OS === 'ios' && (
                <AppleButton
                  buttonStyle={AppleButton.Style.WHITE}
                  buttonType={AppleButton.Type.SIGN_IN}
                  style={styles.appleButton}
                  onPress={onAppleButtonPress}
                />
              )}
              
              <GoogleSigninButton
                style={styles.googleButton}
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Light}
                onPress={onGoogleButtonPress}
              />
            </View>
          </View>
        )}
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
  signInContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  signedInContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
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
  signInButtonsContainer: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  appleButton: {
    width: 200,
    height: 50,
  },
  googleButton: {
    width: 200,
    height: 50,
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
