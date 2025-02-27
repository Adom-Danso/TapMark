import React, {useState} from 'react';
import { StyleSheet, Text, View, StatusBar, TextInput, Image, FlatList, Pressable, TouchableOpacity } from 'react-native';
import { styled } from 'styled-components/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Custom components
import MarketScreen from './MarketScreen'
import PopularMealsItemList from '../components/PopularMealsItem';
import StoreName from '../components/StoreNamesItem';
import MarketsItemList from '../components/MarketsItem';

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

const MainContent = styled.ScrollView`
	flex: 1;
`

const SearchBarContainer = styled.View`
	padding: 16px;
`

const SearchBar = styled.TextInput`
	font-size: 15px;
	border: 1px solid #801818;
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
	font-weight: bold;
`

// FlatList
const PopularMealsList = styled.FlatList`
	padding: 6px;
`
const StoresList = styled.FlatList`
	padding: 6px;
`
const MarketsList = styled.FlatList`
	padding: 6px
`

const ListSeparator = styled.View`
	margin: 10px;
`

const PopularStoreNamesContainer = styled.View`
	padding: 10px;
`

const AllStoresContainer = styled.View `
	padding: 10px
`

const itemSeparator = () => {
	return (
		<ListSeparator>
		</ListSeparator>
	)
}



const HomeScreen = ({navigation, route}) => {
	const [searchInput, setSearchInput] = useState('')
	// const { setStoreId } = route.params
	const [storeId, setStoreId] = useState(null)
	return (
		<MainContent showsVerticalScrollIndicator={false}>
			<SearchBarContainer>
				<SearchBar onChangeText={setSearchInput} value={searchInput} keyboardAppearance='default' />
			</SearchBarContainer>
			<PopularMealsContainer>
				<PopularMealsHeader>
					<PopularMealsTitle>Popular Meals</PopularMealsTitle>
					<TouchableOpacity>
						<Text>See more</Text>
					</TouchableOpacity>
				</PopularMealsHeader>
				<PopularMealsList
					data={HotMeals}
					renderItem={({item}) => <PopularMealsItemList name={item.name} image={item.image} /> }
					keyExtractor={item => item.name}
					horizontal={true}
					showsHorizontalScrollIndicator={false} 
					ItemSeparatorComponent={ itemSeparator }
				/>
			</PopularMealsContainer>
			<PopularStoreNamesContainer>
				<PopularMealsHeader>
					<PopularMealsTitle>Popular Sellers</PopularMealsTitle>
				</PopularMealsHeader>
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
			</PopularStoreNamesContainer>
			<AllStoresContainer>
				<PopularMealsHeader>
					<PopularMealsTitle>Markets</PopularMealsTitle>
				</PopularMealsHeader>
				<MarketsList
					data={HotMeals}
					renderItem={({item}) => <MarketsItemList name={item.name} image={item.image} navigation={navigation} /> }
					keyExtractor={item => item.name}
					horizontal={true}
					showsHorizontalScrollIndicator={false} 
					ItemSeparatorComponent={ itemSeparator }
				/>
			</AllStoresContainer>
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
				component={MarketScreen}
				initialParams={{ stores: Stores }}
			/>
		</HomeStack.Navigator>
	);
};

export default HomeStackScreen;


