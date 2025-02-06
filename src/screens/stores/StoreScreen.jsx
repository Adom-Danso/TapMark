import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import {styled} from 'styled-components/native'

const ImageContainer = styled.View`
	width: 100%;
	flex: 1;
`

const CoverImage = styled.Image`
	width: 100%;
`

const StoreScreen = ({ route }) => {
	const { id, stores } = route.params;
	const [isLoading, setIsLoading] = useState(true);
	const [currentStore, setCurrentStore] = useState(null);

	const initialisePage = async () => {
		setIsLoading(true);
		const store = stores.find((item) => item.id === id);
		setCurrentStore(store || null);
		setIsLoading(false);
	};

	useEffect(() => {
		initialisePage();
	}, [id]); // Depend on `id` so it re-runs when navigating to a new store

	return (
		<View>
			{isLoading ? (
				<Text>Loading...</Text>
			) : (
				<>
					<ImageContainer>
						<CoverImage
					        style={styles.tinyLogo}
					        source={require('../../../assets/RestaurantCovers/sample.png')}
					      />
					</ImageContainer>
					<Text>{currentStore?.name}</Text>
					{currentStore?.dishes?.map((dish, index) => (
						<Text key={index}>{dish}</Text>
					))}
				</>
			)}
		</View>
	);
};

export default StoreScreen;

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