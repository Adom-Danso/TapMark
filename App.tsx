import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

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

const queryClient = new QueryClient();

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <FavoritesProvider>
          <PaymentMethodsProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Welcome"
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
