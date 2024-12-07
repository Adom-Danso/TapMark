import React from 'react';
import { styled } from 'styled-components/native';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EditProfileScreen from './EditProfileScreen';
import SettingsScreen from './Settings';
import OrderHistoryScreen from './OrderHistory';

const ProfileStack = createNativeStackNavigator()


const DATA = [
	
	{
		id: 1,
		name: 'Order History',
		icon: <MaterialIcons name="delivery-dining" size={30} color="black" />
	},
	{
		id: 2,
		name: 'Settings',
		icon: <SimpleLineIcons name="settings" size={30} color="black" />
	},
]

const MainContent = styled.View`
	flex: 1;
`

const TopView = styled.View`
	flex-direction: column;
	justify-content: center;
	padding: 10px
`

const Profile = styled.View`
	flex-direction: row;
	align-items: center;
	width: 100%;
`

const ProfileIcon = styled.View`
	background-color: grey;
	height: 100px;
	width: 100px;
	border: 1px solid black;
	border-radius: 50%;
`

const ProfileDetails = styled.View`
	padding: 10px;
	flex: 1;
	flex-direction: column;
	gap: 3px
`

const Name = styled.Text`
	font-size: 20px;
`

const MobileNumber = styled.Text`
	font-size: 15px;
`

const EditProfileButton = styled.Pressable`
	padding: 10px;
`

const OptionView = styled.FlatList`
	flex: 1;
	border-width: 1px;
	border-color: #CCC;
`

const OptionList = styled.Pressable`
	padding: 16px;
	flex: 1;
	flex-direction: row;
	justify-content: start;
	align-items: center;
	gap: 5px;
`

const ListSeparator = styled.View`
	height: 1px;
	width: 100%;
	background-color: #CCC;
`

const ItemList = ({ name, icon, navigation }) => (
	<OptionList onPress={() => navigation.navigate(name)}>
		{icon}
		<Text>{name}</Text>
	</OptionList>
)

const itemSeparator = () => (
	<ListSeparator />
)


const ProfileScreen = ({ navigation }) => {
	return (
		<>
			<MainContent>
				<TopView>
					<Profile>
						<ProfileIcon></ProfileIcon>
						<ProfileDetails>
							<Name>
								John Doe
							</Name>
							<MobileNumber>0203378702</MobileNumber>
						</ProfileDetails>
						<EditProfileButton activeOpacity="0.9" onPress={() =>
					        navigation.navigate('EditProfile')
					      }>
							<AntDesign name="edit" size={24} color="black" />
						</EditProfileButton>
					</Profile>
				</TopView>
				<OptionView
					data={DATA}
					renderItem={({item}) => <ItemList name={item.name} icon={item.icon} navigation={navigation}  /> }
					keyExtractor={item => item.id}
					ItemSeparatorComponent={ itemSeparator }
				/>
			</MainContent>
		</>
	)
}


const ProfileStackScreen = () => {
	return (
	    <ProfileStack.Navigator
	      screenOptions={{
	        headerStyle: { backgroundColor: '#6200EE' },
	        headerTintColor: '#fff',
	        headerTitleStyle: { fontWeight: 'bold' },
	      }}
	    >
	      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{headerShown: false }} />
	      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
	      <ProfileStack.Screen name="Order History" component={OrderHistoryScreen} />
	      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
	    </ProfileStack.Navigator>
	  );
}

export default ProfileStackScreen;

const styles = StyleSheet.create({
	separator: {
		height: 1,
		width: '100%',
		backgroundColor: '#CCC'
	}
})