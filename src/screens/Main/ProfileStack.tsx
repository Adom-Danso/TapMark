import React, { useMemo, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from './ProfileScreen';
import EditPersonalInfoScreen from './EditPersonalInfoScreen';
import PaymentMethodsScreen from './PaymentMethodsScreen';
import { usePaymentMethods } from '../../context/PaymentMethodsContext';

const Stack = createNativeStackNavigator();


const ProfileStack = () => {
  const { paymentMethods, setDefaultPaymentMethod, addPaymentMethod, removePaymentMethod } = usePaymentMethods();



  return (
    <Stack.Navigator screenOptions={{ animation: 'slide_from_right' }}>
      <Stack.Screen name="ProfileHome" options={{ headerShown: false }}>
        {(props) => <ProfileScreen {...props} />}
      </Stack.Screen>
      <Stack.Screen name="EditPersonalInfo" options={{ title: 'Personal Info' }}>
        {(props) => (
          <EditPersonalInfoScreen
            {...props}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="PaymentMethods" options={{ title: 'Payment Methods' }}>
        {(props) => (
          <PaymentMethodsScreen
            {...props}
            onSetDefault={setDefaultPaymentMethod}
            onAddMethod={addPaymentMethod}
            onRemoveMethod={removePaymentMethod}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default ProfileStack;
