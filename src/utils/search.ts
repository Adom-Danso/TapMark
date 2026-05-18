import { ProfileData } from '@/schemas/profile';
import * as SecureStore from 'expo-secure-store';

export type SearchData = {
    query: string;
}

export async function saveSearchData(data: SearchData[]) {
    await SecureStore.setItemAsync("search_data", JSON.stringify(data))
}

export async function getSearchData() {
    const data = await SecureStore.getItemAsync("search_data")
    return data ? JSON.parse(data) as SearchData[] : data
}

export async function clearSearchData() {
    await SecureStore.deleteItemAsync("search_data")
}

