import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './HomeScreen';
import StoreDetailsScreen from '../details/StoreDetailsScreen';
import ItemDetailsScreen from '../details/ItemDetailsScreen';
import SectionListScreen from '../details/SectionListScreen';
import OrderDetailsScreen from '../details/OrderDetailsScreen';
import MapPickerScreen from './MapPickerScreen';

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ animation: 'slide_from_right' }}>
      <Stack.Screen name="HomeIndex" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SectionList" component={SectionListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StoreDetails" component={StoreDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="MapPicker"
        component={MapPickerScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
