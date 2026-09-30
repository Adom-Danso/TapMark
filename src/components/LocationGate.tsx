import React, { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../screens/auth/authTheme';
import { useLocation } from '../context/LocationContext';

type LocationGateProps = {
  children: React.ReactNode;
};

const LocationGate = ({ children }: LocationGateProps) => {
  const insets = useSafeAreaInsets();
  const { status, requestLocation } = useLocation();
  const [isRetrying, setIsRetrying] = useState(false);

  const isBlocked = status === 'denied' || status === 'error';
  if (!isBlocked) {
    return <>{children}</>;
  }

  const isDenied = status === 'denied';

  const handleRetry = async () => {
    if (isRetrying) {
      return;
    }

    setIsRetrying(true);
    try {
      await requestLocation();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
      <View style={styles.iconWrap}>
        <Ionicons name={isDenied ? 'lock-closed-outline' : 'location-outline'} size={30} color={AUTH_COLORS.primary} />
      </View>

      <Text style={styles.title}>{isDenied ? 'Location permission needed' : "Couldn't get your location"}</Text>
      <Text style={styles.subtitle}>
        {isDenied
          ? 'TapMark uses your location to show nearby stores and calculate delivery fees. Allow access, then try again.'
          : 'We were unable to get a GPS fix. Check your connection or move somewhere with a clearer view of the sky, then try again.'}
      </Text>

      <TouchableOpacity activeOpacity={0.9} style={styles.primaryButton} onPress={handleRetry} disabled={isRetrying}>
        {isRetrying ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="refresh" size={18} color="#fff" />
        )}
        <Text style={styles.primaryText}>{isRetrying ? 'Trying again…' : 'Try again'}</Text>
      </TouchableOpacity>

      {isDenied ? (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryButton}
          onPress={() => Linking.openSettings()}
        >
          <Ionicons name="settings-outline" size={18} color={AUTH_COLORS.primary} />
          <Text style={styles.secondaryText}>Open settings</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AUTH_SPACING.screenX + 6,
    paddingBottom: 60,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AUTH_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: AUTH_COLORS.muted,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    marginTop: 28,
    paddingVertical: 15,
    borderRadius: AUTH_RADII.pill,
    backgroundColor: AUTH_COLORS.primary,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: AUTH_RADII.pill,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  secondaryText: {
    color: AUTH_COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default LocationGate;
