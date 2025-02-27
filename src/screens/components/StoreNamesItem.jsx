import { Text, Pressable, StyleSheet } from "react-native";

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


export default StoreName
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