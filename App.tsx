import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import * as SplashScreen from "expo-splash-screen"

import WelcomePage from './src/screens/auth/WelcomePage';
import LoginPage from './src/screens/auth/LoginPage';
import SignupPage from './src/screens/auth/SignupPage';
import OtpPage from './src/screens/auth/OtpPage';
import BottomTabs from './BottomTabs';
import MapPickerScreen from './src/screens/Main/MapPickerScreen';
import { LocationProvider } from './src/context/LocationContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { PaymentMethodsProvider } from './src/context/PaymentMethodsContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import React from 'react';
import { getTokens } from '@/utils/tokens';
import { checkUserTokens } from '@/functions/auth/check-token';

const queryClient = new QueryClient();

const Stack = createNativeStackNavigator();
SplashScreen.preventAutoHideAsync()

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false)
  const [initialScreen, setInitialScreen] = useState('Welcome');

  React.useEffect(()=>{
    const prepareApp = async () => {
      try {
        const { accessToken, refreshToken } = await getTokens();
        if (accessToken && refreshToken) {
          // Tokens found, user is authenticated, now check if tokens are valid
          await checkUserTokens();
          setInitialScreen('Main');
        } else {
          // No tokens found, user is not authenticated
          setInitialScreen('Welcome');
        }
      } catch (error: any) {
        setInitialScreen('Welcome');
      } finally {
        setIsAppReady(true);
      }
    }
    prepareApp();
  },[])

  React.useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <FavoritesProvider>
          <PaymentMethodsProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName={initialScreen}
                screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
              >
                <Stack.Screen name="Welcome" component={WelcomePage} />
                <Stack.Screen name="Login" component={LoginPage} />
                <Stack.Screen name="Signup" component={SignupPage} />
                <Stack.Screen name="Otp" component={OtpPage} />
                <Stack.Screen name="Main" component={BottomTabs} />
              </Stack.Navigator>
              <Toast />
            </NavigationContainer>
          </PaymentMethodsProvider>
        </FavoritesProvider>
      </QueryClientProvider>
    </SafeAreaView>
  );
}
