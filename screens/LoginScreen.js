import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { FIREBASE_AUTH_DOMAIN } from '@env';

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = React.useRef(null);

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert('Invalid phone number', 'Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current
      );
      setLoading(false);
      Alert.alert('OTP Sent', 'Check your phone for the verification code');
      navigation.navigate('OTP', { verificationId });
    } catch (error) {
      setLoading(false);
      console.error('Error sending OTP:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={{
          apiKey: process.env.FIREBASE_API_KEY,
          authDomain: FIREBASE_AUTH_DOMAIN,
        }}
      />

      <Text style={styles.title}>Login with Phone Number</Text>

      <TextInput
        style={styles.input}
        placeholder="+60XXXXXXXXX"
        keyboardType="phone-pad"
        value={phoneNumber}
