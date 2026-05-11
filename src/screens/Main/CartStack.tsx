import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CartScreen from './CartScreen';
import PaymentScreen from './PaymentScreen';
import OrdersScreen from './OrdersScreen';
import OrderDetailsScreen from '../details/OrderDetailsScreen';

const Stack = createNativeStackNavigator();

const CartStack = () => {
  return (
    <Stack.Navigator screenOptions={{ animation: 'slide_from_right' }}>
      <Stack.Screen name="CartIndex" component={CartScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default CartStack;
