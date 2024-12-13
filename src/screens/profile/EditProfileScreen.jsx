import React from 'react';
import { Text, View, TextInput } from 'react-native';
import { styled } from 'styled-components/native';


const MainContent = styled.View`
	padding: 16px;
`

const EditProfileForm = styled.View`
`

const FirstName = styled.TextInput`
	border: 1px solid #CCC;
`
const LastName = styled.TextInput`
	border: 1px solid #CCC;
`
const Email = styled.TextInput`
	border: 1px solid #CCC;
`
const Phone = styled.TextInput`
	border: 1px solid #CCC;
`

const EditProfileScreen = () => {
	return (
		<MainContent>
			<EditProfileForm>
				<FirstName inputMode='text' />
				<LastName inputMode='text' />
				<Email inputMode='email' />
				<Phone inputMode='tel' />
			</EditProfileForm>
		</MainContent>
	)
}

export default EditProfileScreen