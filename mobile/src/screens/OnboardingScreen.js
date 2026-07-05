import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, StyleSheet } from 'react-native';

const OnboardingScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.logoCircle1} />
        <View style={styles.logoCircle2} />
      </View>

      <Text style={styles.title}>Sign In Companion</Text>

      {/* Illustration placeholder */}
      <View style={styles.illustrationWrap}>
        <View style={styles.illustrationBg}>
          {/* Green building blocks visual */}
          {[
            { top: 10, left: 40, w: 120, h: 36 },
            { top: 50, left: 20, w: 160, h: 36 },
            { top: 90, left: 10, w: 180, h: 36 },
          ].map((s, i) => (
            <View key={i} style={[styles.block, { top: s.top, left: s.left, width: s.w, height: s.h }]} />
          ))}
          {/* Location pin */}
          <View style={styles.pin} />
        </View>
      </View>

      <View style={styles.bottomWrap}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('InviteCode')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Get started</Text>
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
  logoWrap:         { flexDirection: 'row', alignItems: 'center', marginTop: 48, marginBottom: 12 },
  logoCircle1:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4ade80', marginRight: -12, zIndex: 1 },
  logoCircle2:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2b4594', opacity: 0.85 },
  title:            { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 32 },
  illustrationWrap: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  illustrationBg:   { width: 260, height: 180, position: 'relative' },
  block:            { position: 'absolute', backgroundColor: '#4ade80', borderRadius: 8, opacity: 0.85 },
  pin:              { position: 'absolute', top: 20, right: 30, width: 20, height: 28, backgroundColor: '#4ade80', borderRadius: 10 },
  bottomWrap:       { width: '100%', paddingBottom: 40 },
  btn:              { backgroundColor: '#4ade80', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  btnText:          { fontSize: 17, fontWeight: '700', color: '#111827' },
  aboutBtn:         { alignItems: 'center' },
  aboutText:        { fontSize: 15, color: '#6b7280' },
});

export default OnboardingScreen;
