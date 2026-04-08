import React, { useState, useContext } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { BlurView } from 'expo-blur';
import { AuthContext } from '../../context/AuthContext';
import RegisterScreen from './RegisterScreen';
import DashboardScreen from '../main/DashboardScreen';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const isFocused = useIsFocused();
  const { login, isLoading } = useContext(AuthContext);

  // --- NEW EXPO-VIDEO API ---
  // Using a bulletproof Google Cloud URL guaranteed to work on Android Emulators
  
  const player = useVideoPlayer(require('../../../assets/Login_video.mp4'), player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    setErrorMsg(''); 
    
    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- NEW VIDEO VIEW --- */}
      {isFocused && (
        <VideoView
          style={StyleSheet.absoluteFillObject}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
      )}

      {/* Dark overlay to make text pop over the video */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>BioSync<Text style={{color: '#38BDF8'}}>AI</Text></Text>
          <Text style={styles.subtitle}>Intelligence meets biology.</Text>
        </View>

        {/* --- FROSTED GLASS CARD --- */}
        {/* We add a subtle rgba background color to assist Android's blur engine */}
        <BlurView intensity={50} tint="dark" style={styles.glassCard}>
          
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="alex@biosync.com"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              selectionColor="#38BDF8"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              selectionColor="#38BDF8"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.buttonText}>Authenticate</Text>
            )}
          </TouchableOpacity>
        </BlurView>

        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.linkText}>
            Initialize new profile? <Text style={styles.linkHighlight}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.3)', // Crucial for Android to look like glass
    overflow: 'hidden', 
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#FCA5A5',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#38BDF8',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  linkButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  linkHighlight: {
    color: '#38BDF8',
    fontWeight: 'bold',
  }
});