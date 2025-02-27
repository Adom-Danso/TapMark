import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import {styled} from 'styled-components/native'

// components
import SellersItem from '../components/SellersItem';
import PopularMealsItemList from '../components/PopularMealsItem';

const SellersContainer = styled.FlatList`
	padding: 6px;
`

const MainContent = styled.View`
	flex: 1;
`

const ListSeparator = styled.View`
	margin: 5px;
`

const itemSeparator = () => {
	return (
		<ListSeparator>
		</ListSeparator>
	)
}

const HotMeals = [
	{
		name: 'Fufu',
		image: '../../../assets/foodCovers/burger.jpg'
	},
	{
		name: 'Burger',
		image: '../../../assets/foodCovers/burger.jpg'
	},
	{
		name: 'Fries',
		image: '../../../assets/foodCovers/burger.jpg'
	},
	{
		name: 'Banky',
		image: '../../../assets/foodCovers/burger.jpg'
	},
	{
		name: 'Pizza',
		image: '../../../assets/foodCovers/burger.jpg'
	},
	
]

const MarketScreen = ({navigation, route }) => {
	const { id, stores } = route.params;
	const [isLoading, setIsLoading] = useState(true);
	const [currentStore, setCurrentStore] = useState(null);

	// const initialisePage = async () => {
	// 	setIsLoading(true);
	// 	const store = stores.find((item) => item.id === id);
	// 	setCurrentStore(store || null);
	// 	setIsLoading(false);
	// };

	// useEffect(() => {
	// 	initialisePage();
	// }, [id]); // Depend on `id` so it re-runs when navigating to a new store

	return (
		<MainContent>
			<SellersContainer
				data={HotMeals}
				renderItem={({item}) => <SellersItem state={"Open"} name={item.name} image={item.image} /> }
				keyExtractor={item => item.name}
				showsVerticalScrollIndicator={false} 
				ItemSeparatorComponent={ itemSeparator }
			/>
		</MainContent>
	);
};

export default MarketScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tinyLogo: {
    width: 50,
    height: 50,
  },
  logo: {
    width: 66,
    height: 58,
  },
});


// sts