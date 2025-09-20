import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import React, { useEffect } from 'react';
import { Alert, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function AuthScreen() {
  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: '850162394411-vsjq80mlnqjfoftfevqtni2bb9ratl3d.apps.googleusercontent.com',
      offlineAccess: false,
    });
  }, []);

  const onAppleButtonPress = async () => {
    try {
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

      // Sign the user in with the credential
      console.log('🍎 Apple sign-in...');
      const result = await auth().signInWithCredential(appleCredential);
      console.log('🍎 Success:', result.user.email);
      
      // Navigation will be handled by the auth state listener
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
        const googleCredential = auth.GoogleAuthProvider.credential(data.idToken);

        // Sign-in the user with the credential
        console.log('🔍 Google sign-in...');
        const result = await auth().signInWithCredential(googleCredential);
        console.log('🔍 Success:', result.user.email);
        
        // Navigation will be handled by the auth state listener
      } else {
        // User cancelled the sign-in
        console.log('Google Sign-In cancelled');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled Google Sign-In');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Sign-In In Progress', 'Google Sign-In is already in progress.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Play Services Error', 'Google Play Services not available or outdated.');
      } else {
        Alert.alert('Sign-In Error', 'Failed to sign in with Google. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.titleText}>Welcome to Notica</Text>
          <Text style={styles.subtitleText}>Sign in to continue</Text>
        </View>
        
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  signInButtonsContainer: {
    width: '100%',
    maxWidth: 280,
    gap: 16,
    alignItems: 'center',
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  googleButton: {
    width: '100%',
    height: 50,
  },
});
