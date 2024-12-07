import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const LoginScreen = ({navigation}) => {
	return (
		<View>
			<Text>This is the Profile Page</Text>
			<TouchableOpacity onPress={()=>navigation.navigate("Stores")}>
				<Text>Move</Text>
			</TouchableOpacity>
		</View>
	)
}

export default LoginScreen;

