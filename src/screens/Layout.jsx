import { createStackNavigator } from '@react-navigation/stack';
import StoresScreen from './screen/stores/StoresScreen'
import ProfileScreen from './screen/stores/ProfileScreen'
import LoginScreen from './screen/stores/LoginPage'
import SignupScreen from './screen/stores/SignupPage'

const Stack = createStackNavigator();

function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Stores" component={StoresScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignupScreen} />
    </Stack.Navigator>
  );
}

export default MyStack
// testing 