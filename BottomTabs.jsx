import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import StoresScreen from './src/screens/stores/StoresScreen'
import ProfileStackScreen from './src/screens/profile/ProfileScreen'
import EditProfileScreen from './src/screens/profile/EditProfileScreen'
import LoginScreen from './src/screens/auth/LoginPage'
import SignupScreen from './src/screens/auth/SignupPage'

const Tab = createBottomTabNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator 
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Stores') {
              iconName = 'home-outline';
            } else if (route.name === 'Profile') {
              iconName = 'person-outline';
            } 
            // You can return any component that you like here!
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
          headerShown: false
        })}
    >
      <Tab.Screen name="Stores" component={StoresScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}

export default BottomTabs;