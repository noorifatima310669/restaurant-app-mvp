import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function LoadingScreen({ message = 'Preparing your Urban Fork experience…' }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.mark, { backgroundColor: colors.primary }]}>
          <Text style={[styles.markText, { color: colors.background }]}>UF</Text>
        </View>
        <Text style={[styles.wordmark, { color: colors.text }]}>URBAN FORK</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
        <ActivityIndicator color={colors.accent} size="large" style={styles.spinner} />
        <View style={[styles.skeleton, { backgroundColor: colors.muted }]} />
        <View style={[styles.skeletonShort, { backgroundColor: colors.muted }]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  mark: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  markText: { fontSize: 21, fontWeight: '900', letterSpacing: 1 },
  wordmark: { fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  message: { fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  spinner: { marginVertical: 24 },
  skeleton: { height: 10, width: '70%', borderRadius: 5 },
  skeletonShort: { height: 10, width: '44%', borderRadius: 5, marginTop: 10 },
});
