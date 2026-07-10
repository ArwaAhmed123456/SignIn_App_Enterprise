import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_BLUE = '#2b4594';

const OnboardingScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>

      {/* Logo centred — visual only */}
      <View style={styles.logoSection}>
        <View style={styles.logoCard}>
          <Image
            source={require('../../assets/tipod-logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Sign In Enterprise</Text>
        <Text style={styles.subtitle}>Secure workforce management for Tripod Services</Text>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomWrap}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('GuardLogin')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.portalBtn]}
          onPress={() => navigation.navigate('InviteCode')}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, styles.portalBtnText]}>Connect with Invite Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aboutBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('GuardSignup')}
        >
          <Text style={styles.aboutText}>✏️  New here? <Text style={{ color: BRAND_BLUE, fontWeight: '700' }}>Register</Text></Text>
        </TouchableOpacity>

        {/* About this app — info line, separate from register */}
        <TouchableOpacity
          style={styles.infoBtn}
          activeOpacity={0.6}
        >
          <Text style={styles.infoText}>ⓘ  About this app</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#ffffff', alignItems: 'center', paddingHorizontal: 28 },

  // Logo section — takes remaining space, centred
  logoSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 32,
    padding: 28,
    marginBottom: 28,
    shadowColor: 'transparent',
    elevation: 0,
  },
  logoImg:  { width: 130, height: 72 },
  title:    { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 10, letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20, fontWeight: '500' },

  // Bottom buttons
  bottomWrap: { width: '100%', paddingBottom: 44 },
  btn: {
    backgroundColor: BRAND_BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText:      { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  portalBtn:    { backgroundColor: '#ffffff', borderColor: BRAND_BLUE, borderWidth: 1.5, shadowColor: 'transparent', elevation: 0 },
  portalBtnText:{ color: BRAND_BLUE },
  aboutBtn:     { alignItems: 'center', marginTop: 12 },
  aboutText:    { fontSize: 15, color: '#6b7280' },
  infoBtn:      { alignItems: 'center', marginTop: 10 },
  infoText:     { fontSize: 13, color: '#9ca3af' },
});

export default OnboardingScreen;
