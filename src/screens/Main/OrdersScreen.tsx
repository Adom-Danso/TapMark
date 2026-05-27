import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_SPACING } from '../auth/authTheme';
import OrderCard from '../../components/OrderCard';
import { useCart } from '../../context/CartContext';
import { useQuery } from '@tanstack/react-query';
import { searchOrders } from '@/functions/orders/search-orders';
import { useProfile } from '@/context/ProfileContext';
import { showToast } from '@/utils/notifications';
import { Order } from '@/schemas/orders';

const PAGE_SIZE = 10;

const OrdersScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { addCartLine, clearCart } = useCart();
  const { profileData } = useProfile();

  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');
  const [railWidth, setRailWidth] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const pillTranslate = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listOffset = useRef(new Animated.Value(12)).current;

  const tabWidth = railWidth > 0 ? (railWidth - 8) / 2 : 0;
  const activeIndex = activeTab === 'current' ? 0 : 1;

  const searchOrdersQuery = useQuery({
    queryKey: ['searchOrders', activeTab, skip, profileData?.id],
    enabled: Boolean(profileData?.id),
    queryFn: async () => {
      try {
        const response = await searchOrders(PAGE_SIZE, skip, profileData?.id || null, activeTab === 'current' ? false : true, null, null, null, null, null, null, null, null, null, null);
        return response.data;
      } catch (error: any) {
        showToast('error', error.message || 'Failed to load orders');
        return [];
      }
    }
  });

  useEffect(() => {
    setOrders([]);
    setSkip(0);
    setHasMore(true);
    setIsInitialLoading(true);
    setIsLoadingMore(false);
  }, [activeTab, profileData?.id]);

  useEffect(() => {
    if (searchOrdersQuery.status === 'success') {
      const nextOrders = searchOrdersQuery.data || [];
      setOrders((prevOrders) => {
        if (skip === 0) return nextOrders;
        const existingIds = new Set(prevOrders.map((o) => o.id));
        const toAppend = nextOrders.filter((o) => !existingIds.has(o.id));
        return [...prevOrders, ...toAppend];
      });
      setHasMore(nextOrders.length === PAGE_SIZE);
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchOrdersQuery.data, searchOrdersQuery.status, skip]);

  useEffect(() => {
    if (tabWidth === 0) {
      return;
    }
    Animated.spring(pillTranslate, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [activeIndex, pillTranslate, tabWidth]);

  useEffect(() => {
    listOpacity.setValue(0);
    listOffset.setValue(12);
    Animated.parallel([
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(listOffset, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab, listOffset, listOpacity]);

  const handleOpenOrder = (order: Order) => {
    navigation.navigate('OrderDetails', { orderId: order.id });
  };

  const handleReorder = (order: Order) => {
    clearCart();

    order.cart.cartItems.forEach((item) => {
      addCartLine({
        storeItemId: item.storeItem.id,
        storeId: item.storeItem.storeId,
        title: item.storeItem.name,
        basePrice: item.itemAmount,
        selectedExtras: item.additions,
        note: item.note || '',
        qty: item.quantity,
        itemAmount: item.itemAmount,
      });
    });

    navigation.navigate('Home', {
      screen: 'StoreDetails',
      params: {
        id: order.cart.cartItems[0]?.storeItem.storeId,
        name: order.cart.cartItems[0]?.storeItem.name || 'Store',
      },
    });
  };

  const handleLoadMore = () => {
    if (isInitialLoading || isLoadingMore || searchOrdersQuery.isFetching || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    setSkip((currentSkip) => currentSkip + PAGE_SIZE);
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <OrderCard order={item} onPress={() => handleOpenOrder(item)} onReorder={handleReorder} />
  );

  const renderEmptyState = () => {
    if (isInitialLoading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={AUTH_COLORS.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptyText}>Your current and past orders will appear here.</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) {
      return null;
    }

    return (
      <View style={styles.footerWrap}>
        <ActivityIndicator size="small" color={AUTH_COLORS.primary} />
        <Text style={styles.footerText}>Loading more orders...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: listOpacity,
          transform: [{ translateY: listOffset }],
          flex: 1,
        }}
      >
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.cardList,
              { paddingHorizontal: AUTH_SPACING.screenX, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 },
            ]}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            ListHeaderComponent={
              <View style={styles.headerContent}>
                <Text style={styles.title}>Orders</Text>
                <View
                  style={styles.tabRail}
                  onLayout={(event) => setRailWidth(event.nativeEvent.layout.width)}
                >
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.tabPill,
                      {
                        width: tabWidth,
                        transform: [{ translateX: pillTranslate }],
                      },
                    ]}
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.tabButton}
                    onPress={() => setActiveTab('current')}
                  >
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={activeTab === 'current' ? AUTH_COLORS.primary : AUTH_COLORS.muted}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        activeTab === 'current' ? styles.tabLabelActive : null,
                      ]}
                    >
                      Current
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.tabButton}
                    onPress={() => setActiveTab('past')}
                  >
                    <Ionicons
                      name="archive-outline"
                      size={16}
                      color={activeTab === 'past' ? AUTH_COLORS.primary : AUTH_COLORS.muted}
                    />
                    <Text
                      style={[styles.tabLabel, activeTab === 'past' ? styles.tabLabelActive : null]}
                    >
                      Past
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  headerContent: {
    gap: 16,
    marginBottom: 16,
  },
  tabRail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4ECE7',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E7DDD6',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  tabPill: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: '#FFF5F2',
    borderWidth: 1,
    borderColor: '#F2D6D0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.muted,
  },
  tabLabelActive: {
    color: AUTH_COLORS.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    marginBottom: 12,
  },
  cardList: {
    gap: 12,
    flexGrow: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  emptyText: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: AUTH_COLORS.muted,
  },
});

export default OrdersScreen;
