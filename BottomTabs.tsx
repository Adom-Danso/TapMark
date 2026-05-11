import React, { useEffect, useRef } from 'react';
import {
	Animated,
	Text,
	StyleSheet,
	TouchableOpacity,
	View,
	useWindowDimensions,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AUTH_COLORS, AUTH_RADII } from './src/screens/auth/authTheme';
import HomeStack from './src/screens/Main/HomeStack';
import CartStack from './src/screens/Main/CartStack';
import SearchScreen from './src/screens/Main/SearchScreen';
import FavoritesScreen from './src/screens/Main/FavoritesScreen';
import ProfileStack from './src/screens/Main/ProfileStack';
import { useCart } from './src/context/CartContext';
import { CartProvider } from './src/context/CartContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { LocationProvider } from '@/context/LocationContext';

const Tab = createBottomTabNavigator();

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TAB_BUTTON = 46;
const TAB_PILL_HEIGHT = 46;
const TAB_PILL_MIN_WIDTH = 110;
const TAB_PILL_MAX_WIDTH = 170;
const TAB_BAR_PADDING = 14;
const TAB_BAR_BASE_WIDTH = 320;
const TAB_BAR_STEP = 58;
const TAB_BAR_MIN_WIDTH = 300;

const CustomTabBar = ({ state, descriptors, navigation }) => {
	const insets = useSafeAreaInsets();
	const { width: screenWidth } = useWindowDimensions();
	const { totalItems } = useCart();
	const cartCount = totalItems;
	const tabCount = state.routes.length;
	const barWidth = Math.min(
		screenWidth - 24,
		Math.max(TAB_BAR_MIN_WIDTH, TAB_BAR_BASE_WIDTH + (tabCount - 4) * TAB_BAR_STEP)
	);
	const slotWidth = (barWidth - TAB_BAR_PADDING * 2) / tabCount;
	const circleSize = Math.min(TAB_BUTTON, Math.max(38, slotWidth));
	const pillWidth = Math.min(
		TAB_PILL_MAX_WIDTH,
		Math.max(TAB_PILL_MIN_WIDTH, slotWidth * 1.7)
	);
	const animatedScales = useRef(new Map()).current;

	useEffect(() => {
		state.routes.forEach((route, index) => {
			const scale = getScaleValue(animatedScales, route.key);
			Animated.spring(scale, {
				toValue: state.index === index ? 1.08 : 1,
				useNativeDriver: true,
				speed: 20,
				bounciness: 8,
			}).start();
		});
	}, [animatedScales, state.index, state.routes]);

	return (
		<View style={[styles.tabBarWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
			<View style={[styles.tabBar, { width: barWidth }]}>
				{state.routes.map((route, index) => {
					const { options } = descriptors[route.key];
					const isFocused = state.index === index;
					const isSearch = route.name === 'Search';

					const onPress = () => {
						const event = navigation.emit({
							type: 'tabPress',
							target: route.key,
							canPreventDefault: true,
						});

						if (!isFocused && !event.defaultPrevented) {
							navigation.navigate(route.name);
						}
					};

					const onLongPress = () => {
						navigation.emit({ type: 'tabLongPress', target: route.key });
					};

					const iconName = getIconName(route.name, isFocused);
					const iconColor = isFocused ? AUTH_COLORS.primary : AUTH_COLORS.muted;

					const scale = getScaleValue(animatedScales, route.key);
					const translateY = scale.interpolate({
						inputRange: [0.95, 1.08],
						outputRange: [0, -2],
					});

					return (
						<AnimatedTouchable
							key={route.key}
							accessibilityRole="button"
							accessibilityState={isFocused ? { selected: true } : {}}
							accessibilityLabel={options.tabBarAccessibilityLabel}
							testID={options.tabBarTestID}
							onPress={onPress}
							onLongPress={onLongPress}
							onPressIn={() => {
								Animated.spring(scale, {
									toValue: 0.95,
									useNativeDriver: true,
									speed: 20,
									bounciness: 6,
								}).start();
							}}
							onPressOut={() => {
								Animated.spring(scale, {
									toValue: isFocused ? 1.08 : 1,
									useNativeDriver: true,
									speed: 20,
									bounciness: 8,
								}).start();
							}}
							activeOpacity={0.85}
							style={[
								styles.tabButton,
								{
									width: isSearch ? pillWidth : circleSize,
									height: isSearch ? TAB_PILL_HEIGHT : circleSize,
									transform: [{ scale }, { translateY }],
								},
								isSearch ? styles.searchButton : styles.circleButton,
								isSearch && isFocused ? styles.searchButtonActive : null,
							]}
						>
							<Ionicons
								name={iconName}
								size={isSearch ? 22 : 22}
								color={isSearch && isFocused ? '#fff' : iconColor}
							/>
							{isSearch ? (
								<Text
									style={[
										styles.searchLabel,
										{ color: isFocused ? '#fff' : AUTH_COLORS.text },
									]}
								>
									Search
								</Text>
							) : null}
							{route.name === 'Cart' && cartCount > 0 ? (
								<View style={styles.badge}>
									<Text style={styles.badgeText}>
										{cartCount > 9 ? '9+' : String(cartCount)}
									</Text>
								</View>
							) : null}
						</AnimatedTouchable>
					);
				})}
			</View>
		</View>
	);
};

const getScaleValue = (cache, key) => {
	if (!cache.has(key)) {
		cache.set(key, new Animated.Value(1));
	}

	return cache.get(key);
};

const getIconName = (routeName, focused) => {
	switch (routeName) {
		case 'Home':
			return focused ? 'home' : 'home-outline';
		case 'Cart':
			return focused ? 'cart' : 'cart-outline';
		case 'Search':
			return focused ? 'search' : 'search-outline';
		case 'Favourites':
			return focused ? 'heart' : 'heart-outline';
		case 'Profile':
			return focused ? 'person' : 'person-outline';
		default:
			return 'ellipse';
	}
};

const BottomTabs = () => {
	return (
		<CartProvider>
			<ProfileProvider>
				<LocationProvider>
					<Tab.Navigator
						initialRouteName="Home"
						screenOptions={{ headerShown: false }}
						lazy={false}
						detachInactiveScreens={false}
						tabBar={(props) => <CustomTabBar {...props} />}
					>
						<Tab.Screen name="Home" component={HomeStack} />
						<Tab.Screen name="Cart" component={CartStack} />
						<Tab.Screen name="Search" component={SearchScreen} />
						<Tab.Screen name="Favourites" component={FavoritesScreen} />
						<Tab.Screen name="Profile" component={ProfileStack} />
					</Tab.Navigator>
				</LocationProvider>
			</ProfileProvider>
		</CartProvider>
	);
};

const styles = StyleSheet.create({
	tabBarWrap: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
	},
	tabBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: AUTH_COLORS.card,
		borderRadius: 40,
		paddingHorizontal: TAB_BAR_PADDING,
		paddingVertical: 10,
		shadowColor: AUTH_COLORS.shadow,
		shadowOpacity: 1,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 8,
	},
	tabButton: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	circleButton: {
		height: TAB_BUTTON,
		width: TAB_BUTTON,
		borderRadius: TAB_BUTTON / 2,
		backgroundColor: '#fff',
	},
	searchButton: {
		height: TAB_PILL_HEIGHT,
		borderRadius: AUTH_RADII.pill,
		backgroundColor: AUTH_COLORS.primarySoft,
		flexDirection: 'row',
		gap: 8,
	},
	searchButtonActive: {
		backgroundColor: AUTH_COLORS.primary,
	},
	searchLabel: {
		fontSize: 14,
		fontWeight: '600',
	},
	badge: {
		position: 'absolute',
		top: -2,
		right: -2,
		minWidth: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: '#E53935',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
	},
	badgeText: {
		color: '#fff',
		fontSize: 10,
		fontWeight: '700',
	},
});

export default BottomTabs;
