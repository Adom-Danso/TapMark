import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_SPACING } from '../auth/authTheme';
import OrderCard from '../../components/OrderCard';
import { ORDERS } from '../../functions/orderData';
import { useCart } from '../../context/CartContext';
import { useQuery } from '@tanstack/react-query';
import { searchOrders } from '@/functions/orders/search-orders';
import { useProfile } from '@/context/ProfileContext';
import { showToast } from '@/utils/notifications';
import { Order } from '@/schemas/orders';

const OrdersScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { addCartLine, clearCart } = useCart();
  const {profileData} = useProfile()

  const [activeTab, setActiveTab] = useState('current');
  const [railWidth, setRailWidth] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);

  const pillTranslate = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listOffset = useRef(new Animated.Value(12)).current;

  const tabWidth = railWidth > 0 ? (railWidth - 8) / 2 : 0;
  const activeIndex = activeTab === 'current' ? 0 : 1;

  const searchOrdersQuery = useQuery({
    queryKey: ['searchOrders', activeTab],
    queryFn: async () => {
      try {
        const response = await searchOrders(
          20,
          0,
          profileData?.id || null,
          activeTab === 'current' ? false : true,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        )
        return response.data;
      } catch (error: any) {
        showToast("error", error.message || "Failed to load orders");
        return [];
      }
    }
  })
  React.useEffect(()=> {
    if (searchOrdersQuery.data && searchOrdersQuery.status === 'success') {
      setOrders(searchOrdersQuery.data);
    }
  }, [searchOrdersQuery.data, searchOrdersQuery.status])

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
    // Clear existing cart and add items from the order
    clearCart();
    
    order.items.forEach((item) => {
      addCartLine({
        itemId: item.id,
        storeId: order.storeId,
        title: item.title,
        basePrice: item.price,
        qty: item.qty,
      });
    });

    // Navigate to the store with storeId
    navigation.navigate('Home', {
      screen: 'StoreDetails',
      params: { id: order.storeId, title: order.storeName },
    });
  };

  const visibleOrders = useMemo(
    () => ORDERS.filter((order) => (activeTab === 'current' ? order.status === 'pending' : order.status !== 'pending')),
    [activeTab]
  );
  const orderCards = useMemo(
    () =>
      orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onPress={() => handleOpenOrder(order)}
          onReorder={handleReorder}
        />
      )),
    [visibleOrders]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
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

        <Animated.View
          style={{
            opacity: listOpacity,
            transform: [{ translateY: listOffset }],
          }}
        >
          <View style={styles.cardList}>{orderCards}</View>
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
    paddingBottom: 80,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AUTH_COLORS.text,
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
  },
});

export default OrdersScreen;
