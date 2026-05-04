import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from './authTheme';

const WelcomePage = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AUTH_COLORS.background} />
      <View style={styles.container}>
        <View style={styles.heroWrap}>
          <Image
            source={require('../../../assets/foodCovers/burger.jpg')}
            resizeMode="cover"
            style={styles.heroImage}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome to TapMark</Text>
          <Text style={styles.subtitle}>
            Campus delivery made simple. Fresh meals, quick rides, zero stress.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: AUTH_SPACING.screenY,
    paddingBottom: AUTH_SPACING.block,
    justifyContent: 'space-around',
  },
  heroWrap: {
    borderRadius: 26,
    overflow: 'hidden',
    height: 360,
    backgroundColor: AUTH_COLORS.card,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: AUTH_RADII.card,
    padding: AUTH_SPACING.block,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: AUTH_COLORS.muted,
    lineHeight: 20,
    marginBottom: 18,
  },
  primaryButton: {
    backgroundColor: AUTH_COLORS.primary,
    borderRadius: AUTH_RADII.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: AUTH_RADII.pill,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AUTH_COLORS.primarySoft,
  },
  secondaryButtonText: {
    color: AUTH_COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WelcomePage;
