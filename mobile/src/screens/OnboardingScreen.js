import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const BRAND_BLUE = '#2b4594';

const OnboardingScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>

      {/* Logo — uses Tipod logo from assets */}
      <View style={styles.logoWrap}>
        <Image
          source={require('../../assets/tipod-logo.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Sign In Enterprise</Text>

      {/* Illustration */}
      <View style={styles.illustrationWrap}>
        <View style={styles.illustrationBg}>
          {/* Building blocks in brand blue */}
          {[
            { top: 10,  left: 40,  w: 120, h: 36 },
            { top: 54,  left: 20,  w: 160, h: 36 },
            { top: 98,  left: 10,  w: 180, h: 36 },
            { top: 142, left: 30,  w: 140, h: 36 },
          ].map((s, i) => (
            <View key={i} style={[styles.block, {
              top: s.top, left: s.left, width: s.w, height: s.h,
              opacity: 0.75 + i * 0.06,
            }]} />
          ))}
          {/* Location pin */}
          <View style={styles.pin} />
          {/* Small decorative circles */}
          <View style={[styles.dot, { top: 30, right: 20 }]} />
          <View style={[styles.dot, { top: 100, right: 50, width: 12, height: 12, borderRadius: 6 }]} />
        </View>
      </View>

      <View style={styles.bottomWrap}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('InviteCode')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Connect with Invite Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.portalBtn]}
          onPress={() => navigation.navigate('GuardLogin')}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, styles.portalBtnText]}>Security / Manager Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.aboutBtn} activeOpacity={0.7}>
          <Text style={styles.aboutText}>ⓘ  About this app</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#ffffff', alignItems: 'center', paddingHorizontal: 24 },
  logoWrap:         { marginTop: 52, marginBottom: 16, alignItems: 'center' },
  logoImg:          { width: 120, height: 64 },
  title:            { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 28, letterSpacing: -0.3 },
  illustrationWrap: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  illustrationBg:   { width: width * 0.78, height: 220, position: 'relative' },
  block:            { position: 'absolute', backgroundColor: BRAND_BLUE, borderRadius: 10 },
  pin:              { position: 'absolute', top: 14, right: 28, width: 22, height: 30, backgroundColor: BRAND_BLUE, borderRadius: 11 },
  dot:              { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: '#e0e7ff' },
  bottomWrap:       { width: '100%', paddingBottom: 44 },
  btn:              { backgroundColor: BRAND_BLUE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 14, shadowColor: BRAND_BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText:          { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  portalBtn:        { backgroundColor: '#ffffff', borderColor: BRAND_BLUE, borderWidth: 1.5, shadowColor: 'transparent', elevation: 0 },
  portalBtnText:    { color: BRAND_BLUE },
  aboutBtn:         { alignItems: 'center', marginTop: 12 },
  aboutText:        { fontSize: 15, color: '#6b7280' },
});

export default OnboardingScreen;
