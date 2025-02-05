import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import {StyleSheet} from 'react-native';

import HomeStackScreen from './src/screens/stores/HomeScreen'
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

          if (route.name === 'Home') {
            iconName = 'home-outline';
          } else if (route.name === 'You') {
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
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="You" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}

export default BottomTabs;
