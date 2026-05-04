import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './HomeScreen';
import StoreDetailsScreen from '../details/StoreDetailsScreen';
import ItemDetailsScreen from '../details/ItemDetailsScreen';
import SectionListScreen from '../details/SectionListScreen';

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeIndex" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SectionList" component={SectionListScreen} options={{ title: 'Section' }} />
      <Stack.Screen name="StoreDetails" component={StoreDetailsScreen} options={{ title: 'Store' }} />
      <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} options={{ title: 'Item' }} />
    </Stack.Navigator>
  );
};

export default HomeStack;
