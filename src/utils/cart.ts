import * as SecureStore from 'expo-secure-store';

export async function saveActiveCartId(cartId:string) {
    await SecureStore.setItemAsync("activeCartId", cartId)
}

export async function getActiveCartId() {
    const cartId = await SecureStore.getItemAsync("activeCartId")
    return cartId as string
}