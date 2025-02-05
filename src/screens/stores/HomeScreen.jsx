import React, {useState} from 'react';
import { StyleSheet, Text, View, StatusBar, TextInput, Image, FlatList, Pressable } from 'react-native';
import { styled } from 'styled-components/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StoreScreen from './StoreScreen'

const HomeStack = createNativeStackNavigator()

const Stores = [
	{
		id: 1,
		name: 'KFC',
		dishes: ['Oat Meals', 'Burger', 'MilkShake', 'Fries', 'Jollof', 'Banku', 'Pizza', 'Milo N Bread'],
		location: 'Tabora',
		rating: 4,
	}, 
	{
		id: 2,
		name: 'Jukes N Foods',
		dishes: ['Oat Meals', 'Burger', 'MilkShake', 'Fries', 'Jollof', 'Banku', 'Pizza', 'Milo N Bread'],
		location: 'Tabora',
		rating: 4,
	}, 
	{
		id: 3,
		name: 'Adom\'s food joint',
		dishes: ['Oat Meals', 'Burger', 'MilkShake', 'Fries', 'Jollof', 'Banku', 'Pizza', 'Milo N Bread'],
		location: 'Tabora',
		rating: 4,
	}, 
	{
		id: 4,
		name: 'Jon Chief',
		dishes: ['Oat Meals', 'Burger', 'MilkShake', 'Fries', 'Jollof', 'Banku', 'Pizza', 'Milo N Bread'],
		location: 'Tabora',
		rating: 4,
	}, 
	{
		id: 5,
		name: 'Papa\'s Pizza',
		dishes: ['Oat Meals', 'Burger', 'MilkShake', 'Fries', 'Jollof', 'Banku', 'Pizza', 'Milo N Bread'],
		location: 'Tabora',
		rating: 4,
	}, 
	{
		id: 6,
		name: 'Eddy\'s Pizza',
		dishes: ['Oat Meals', 'Burger', 'MilkShake', 'Fries', 'Jollof', 'Banku', 'Pizza', 'Milo N Bread'],
		location: 'Tabora',
		rating: 4,
	}
]

const HotMeals = [
	{
		name: 'Fufu',
		image: <Image source={require('../../../assets/foodCovers/burger.jpg')} />
	},
	{
		name: 'Burger',
		image: <Image source={require('../../../assets/foodCovers/burger.jpg')} />
	},
	{
		name: 'Fries',
		image: <Image source={require('../../../assets/foodCovers/burger.jpg')} />
	},
	{
		name: 'Banky',
		image: <Image source={require('../../../assets/foodCovers/burger.jpg')} />
	},
	{
		name: 'Pizza',
		image: <Image source={require('../../../assets/foodCovers/burger.jpg')} />
	},
]

const MainContent = styled.View`
	flex: 1;
`

const SearchBarContainer = styled.View`
	padding: 16px;
`

const SearchBar = styled.TextInput`
	font-size: 15px;
	border: 1px solid black;
	border-radius: 20px;
	padding: 12px;
	background-color: #CCC;
`

const PopularMealsContainer = styled.View`
	padding: 10px;
`

const PopularMealsHeader = styled.View`
	padding: 10px;
	flex-direction: row;
	justify-content: space-between;
`
const PopularMealsTitle = styled.Text`
	font-size: 18px;
`

const PopularMealsList = styled.FlatList`
	padding: 6px;
`

const ListSeparator = styled.View`
	margin: 10px;
`

const Card = styled.View`
	width: 250px;
	height: 200px;
	border-radius: 10px;
	padding: 10px;	
	background-color: white;
	box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.15);
`

const CardCover = styled.Image`
	border-radius: 10px;
	width: 100%;
`

const CardTitle = styled.Text`
	font-size: 18px;
	padding: 6px;
`

const StoreNamesContainer = styled.View`
	padding: 10px;
`

const StoresList = styled.FlatList`
	padding: 6px;
`

const ItemList = ({image, name}) => {
	return (
		<Card>
			<CardCover source={require('../../../assets/foodCovers/burger.jpg')} />
			<CardTitle>{name}</CardTitle>
		</Card>
	)
}

const itemSeparator = () => {
	return (
		<ListSeparator>
		</ListSeparator>
	)
}

const StoreName = ({ name, onpress, navigation, id }) => {
	return (
		<Pressable
			style={styles.storeName}
			onPress={() => {
				onpress();
				navigation.navigate('Store', { id });
			}}
		>
			<Text>{name}</Text>
		</Pressable>
	);
};


const HomeScreen = ({navigation, route}) => {
	const [searchInput, setSearchInput] = useState('')
	// const { setStoreId } = route.params
	const [storeId, setStoreId] = useState(null)
	return (
		<MainContent>
			<SearchBarContainer>
				<SearchBar onChangeText={setSearchInput} value={searchInput} keyboardAppearance='default' />
			</SearchBarContainer>
			<PopularMealsContainer>
				<PopularMealsHeader>
					<PopularMealsTitle>Popular Meals</PopularMealsTitle>
					<Text>All ></Text>
				</PopularMealsHeader>
				<PopularMealsList
					data={HotMeals}
					renderItem={({item}) => <ItemList name={item.name} image={item.image} /> }
					keyExtractor={item => item.name}
					horizontal={true}
					showsHorizontalScrollIndicator={false} 
					ItemSeparatorComponent={ itemSeparator }
				/>
			</PopularMealsContainer>
			<StoreNamesContainer>
				<StoresList
					data={Stores}
					renderItem={({ item }) => (
						<StoreName
							navigation={navigation}
							name={item.name}
							id={item.id}
							onpress={() => setStoreId(item.id)}
						/>
					)}
					keyExtractor={(item) => item.id.toString()}
					horizontal={true}
					showsHorizontalScrollIndicator={false}
					ItemSeparatorComponent={itemSeparator}
				/>
			</StoreNamesContainer>
		</MainContent>
	)
}

const HomeStackScreen = () => {
	return (
		<HomeStack.Navigator
			screenOptions={{
				headerShown: false,
				headerTintColor: '#fff',
				headerTitleStyle: { fontWeight: 'bold' },
			}}
		>
			<HomeStack.Screen
				name="Home"
				component={HomeScreen}
				initialParams={{ stores: Stores }}
				options={{ headerShown: false }}
			/>
			<HomeStack.Screen
				name="Store"
				component={StoreScreen}
				initialParams={{ stores: Stores }}
			/>
		</HomeStack.Navigator>
	);
};

export default HomeStackScreen;


const styles = StyleSheet.create({
	storeName: {
		backgroundColor: '#CCC',
		color: 'green',
		padding: 5,
		paddingLeft: 10,
		paddingRight: 10,
		borderRadius: 15,
	}
})