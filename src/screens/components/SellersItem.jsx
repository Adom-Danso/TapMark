import { styled } from 'styled-components/native';
import { View } from 'react-native';


const Card = styled.View`
    width: 100%;
	height: 90px;
	border-radius: 10px;
	padding: 10px;	
    flex-direction: row;
	background-color: white;
	box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.15);
`

const CardName = styled.Text`
    font-size: 18px;
    padding: 6px;
`

const CardState = styled.Text`
    font-size: 14px;
    color: green;
    padding: 6px;
`
const CardCover = styled.Image`
	border-radius: 10px;
	width: 35%;
    height: 100%
`


const SellersItem = ({image, name, state})=>{
    return (
        <Card>
            <CardCover source={require('../../../assets/foodCovers/burger.jpg')} />

            <View>
                <CardName>{name}</CardName>
                <CardState>{state}</CardState>
            </View>
        </Card>
    )
}

export default SellersItem