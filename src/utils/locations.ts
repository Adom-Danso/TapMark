import { LocationSchema } from '@/schemas/location';
import * as SecureStore from 'expo-secure-store';


export async function saveLocations(locations:LocationSchema[]) {
    await SecureStore.setItemAsync('recent_locations', JSON.stringify(locations));
}

export async function getLocations() {
    const locations = await SecureStore.getItemAsync('recent_locations');
    return locations ? JSON.parse(locations) as LocationSchema[] : [];
}

export async function clearLocations() {
    await SecureStore.deleteItemAsync('recent_locations');
}