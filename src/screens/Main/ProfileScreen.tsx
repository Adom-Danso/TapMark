import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../auth/authTheme';
import { useFavorites } from '../../context/FavoritesContext';
import { useLocation } from '../../context/LocationContext';
import { getProfileData } from '@/utils/profile';
import { ProfileData } from '@/schemas/profile';
import { UserWallet } from '@/schemas/wallets';
import { getOneUserWallets } from '@/functions/wallets/get-one-wallet-by-id';
import { showToast } from '@/utils/notifications';
import { useQuery } from '@tanstack/react-query';
import { addOneUserWallets } from '@/functions/wallets/add-one-user-wallet';
import { useProfile } from '@/context/ProfileContext';
import { usePaymentMethods } from '@/context/PaymentMethodsContext';

const ActionRow = ({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.actionRow}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.actionIconWrap}>
          <Ionicons name={icon} size={18} color={AUTH_COLORS.primary} />
        </View>
        <View style={styles.actionTextWrap}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={AUTH_COLORS.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const ProfileScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const insets = useSafeAreaInsets();
  const { favoriteStores } = useFavorites();
  const { currentLocation } = useLocation();
  const {paymentMethods} = usePaymentMethods()

  const [bannerMessage, setBannerMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [visibleBalance, setVisibleBalance] = useState(0);
  const {profileData, userWallet} = useProfile()

  const cardIntro = useRef(new Animated.Value(0)).current;
  const walletIntro = useRef(new Animated.Value(0)).current;
  const actionsIntro = useRef(new Animated.Value(0)).current;
  const logoutIntro = useRef(new Animated.Value(0)).current;
  const walletCounter = useRef(new Animated.Value(0)).current;


  const goToAuthWelcome = () => {
    const rootNav = navigation.getParent()?.getParent();
    if (rootNav) {
      rootNav.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
      return;
    }

    navigation.navigate('Welcome');
  };



  React.useEffect(() => {
    // play all animation after profile data is loaded
    if (profileData) {
      Animated.stagger(90, [
        Animated.timing(cardIntro, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(walletIntro, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(actionsIntro, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(logoutIntro, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [profileData])

  React.useEffect(() => {
    const id = walletCounter.addListener(({ value }) => {
      setVisibleBalance(Number(value.toFixed(2)));
    });

    if (userWallet) {
      Animated.timing(walletCounter, {
        toValue: userWallet ? userWallet.availableBalance : 0,
        duration: 450,
        useNativeDriver: false,
      }).start();
    }

    return () => {
      walletCounter.removeListener(id);
    };
  }, [userWallet]);

  useEffect(() => {
    const notice = route?.params?.notice;
    if (!notice) {
      return;
    }

    setBannerMessage(notice);
    const timeoutId = setTimeout(() => {
      setBannerMessage('');
    }, 2200);
    navigation.setParams({ notice: undefined });

    return () => clearTimeout(timeoutId);
  }, [navigation, route?.params?.notice]);

  const initials = `${profileData.firstName[0]}${profileData.lastName[0]}`;

  const completionCount = useMemo(() => {
    const fields = [profileData.email, profileData.phone];
    if (profileData.firstName && profileData.lastName) {
      fields.push(`${profileData.firstName} ${profileData.lastName}`)
    }
    return fields.filter((field) => field && field.trim().length > 0).length;
  }, [profileData]);

  // const handleTopUp = () => {
  //   Alert.alert('Top up wallet', 'Add GHS 20 to your wallet balance?', [
  //     { text: 'Cancel', style: 'cancel' },
  //     {
  //       text: 'Top up',
  //       onPress: () => {
  //         setWalletBalance((prev) => prev + 20);
  //         setBannerMessage('Wallet funded: +GHS 20.00');
  //       },
  //     },
  //   ]);
  // };

  const handleLogout = () => {
    Alert.alert('Sign out', 'You will need to log in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          setIsLoggingOut(true);
          setTimeout(() => {
            setIsLoggingOut(false);
            goToAuthWelcome();
          }, 450);
        },
      },
    ]);
  };

  const introStyle = (value: any) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        {bannerMessage ? (
          <View style={styles.banner}>
            <Ionicons name="checkmark-circle" size={16} color={AUTH_COLORS.primary} />
            <Text style={styles.bannerText}>{bannerMessage}</Text>
          </View>
        ) : null}

        <Animated.View style={[styles.card, introStyle(cardIntro)]}>
          <View style={styles.identityHeader}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{`${profileData.firstName} ${profileData.lastName}`}</Text>
              <Text style={styles.meta}>{profileData.email}</Text>
              <Text style={styles.meta}>{profileData.phone}</Text>
            </View>
          </View>

          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Profile</Text>
              <Text style={styles.chipValue}>{completionCount}/3 complete</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Favourites</Text>
              <Text style={styles.chipValue}>{favoriteStores.length}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Location</Text>
              <Text style={styles.chipValue} numberOfLines={1}>
                {currentLocation.name}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.card, introStyle(walletIntro)]}>
          <Text style={styles.walletLabel}>Wallet balance</Text>
          <Text style={styles.walletAmount}>GHS {visibleBalance.toFixed(2)}</Text>
          {/* <TouchableOpacity style={styles.walletButton} activeOpacity={0.9} onPress={handleTopUp}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.walletButtonText}>Top up wallet</Text>
          </TouchableOpacity> */}
        </Animated.View>

        <Animated.View style={[styles.section, introStyle(actionsIntro)]}>
          <ActionRow
            icon="person-outline"
            title="Edit personal information"
            subtitle="Update your name, email, and phone"
            onPress={() => navigation.navigate('EditPersonalInfo')}
          />
          <ActionRow
            icon="card-outline"
            title="Payment methods"
            subtitle={`${paymentMethods.length} method${paymentMethods.length === 1 ? '' : 's'} added`}
            onPress={() => navigation.navigate('PaymentMethods')}
          />
        </Animated.View>

        <Animated.View style={[styles.logoutWrap, introStyle(logoutIntro)]}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.logoutButton, isLoggingOut ? styles.logoutButtonDisabled : null]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutText}>{isLoggingOut ? 'Signing out...' : 'Sign out'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  scroll: {
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingBottom: 110,
    gap: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: AUTH_COLORS.text,
    letterSpacing: -0.4,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: AUTH_RADII.input,
    backgroundColor: '#F8ECEB',
    borderWidth: 1,
    borderColor: '#EFD8D5',
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    color: AUTH_COLORS.text,
    fontWeight: '600',
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
    gap: 12,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#EEC8C8',
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '800',
    color: AUTH_COLORS.primary,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  meta: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#FBF5F2',
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  chipLabel: {
    fontSize: 11,
    color: AUTH_COLORS.muted,
    fontWeight: '600',
  },
  chipValue: {
    fontSize: 12,
    color: AUTH_COLORS.text,
    fontWeight: '700',
    marginTop: 2,
  },
  walletLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.muted,
  },
  walletAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: AUTH_COLORS.text,
    letterSpacing: -0.6,
  },
  walletButton: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: AUTH_RADII.pill,
    backgroundColor: AUTH_COLORS.primary,
    paddingVertical: 12,
  },
  walletButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AUTH_COLORS.card,
    borderRadius: AUTH_RADII.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  actionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  logoutWrap: {
    marginTop: 4,
  },
  logoutButton: {
    borderRadius: AUTH_RADII.pill,
    backgroundColor: '#C03737',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default ProfileScreen;
