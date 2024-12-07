import { PaperProvider } from 'react-native-paper';
import { StyleSheet, Text, View, SafeAreaView, StatusBar } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { styled } from 'styled-components/native';

import BottomTabs from './BottomTabs'

const Stack = createNativeStackNavigator()

const SafeArea = styled.SafeAreaView`
  flex: 1;
  padding-top: ${StatusBar.currentHeight};
  background-color: white;
`


export default function App({navigation}) {

  return (
    <SafeArea>
      <NavigationContainer>
        <BottomTabs />
      </NavigationContainer>
    </SafeArea>
    
  );
}
