import { styled } from 'styled-components/native';

const CardCover = styled.Image`
	border-radius: 10px;
	width: 100%;
`

const CardTitle = styled.Text`
	font-size: 19px;
	padding: 6px;
`


const Card = styled.Pressable`
	width: 250px;
	height: 200px;
	border-radius: 10px;
	padding: 10px;	
	background-color: white;
	box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.15);
`


const PopularMealsItemList = ({image, name}) => {
	return (
		<Card onPress={()=>{
		}}>
			<CardCover source={require('../../../assets/foodCovers/burger.jpg')} />
			<CardTitle>{name}</CardTitle>
		</Card>
	)
}

export default PopularMealsItemList