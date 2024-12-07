import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BottomTabs from './BottomTabs';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
// import ProfileScreen from './src/screens/profile/ProfileScreen';
// import ProfileScreen from './src/screens/auth/ProfileScreen';
// import ProfileScreen from './src/screens/profile/ProfileScreen';
// import ProfileScreen from './src/screens/profile/ProfileScreen';


const Stack = createNativeStackNavigator()


const Layout = () => {
	return (
		<Stack.Navigator>
			<Stack.Screen name="Tabs" component={BottomTabs} options={{ headerShown: false }} />
			<Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />

		</Stack.Navigator>
	)
}

export default Layout;