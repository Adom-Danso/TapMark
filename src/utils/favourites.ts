import * as SecureStore from 'expo-secure-store';


export async function saveFavorites(favorites:string[]) {
    await SecureStore.setItemAsync('favorite_stores', JSON.stringify(favorites));
}

export async function getFavorites() {
    const favorites = await SecureStore.getItemAsync('favorite_stores');
    return favorites ? JSON.parse(favorites) as string[] : [];
}