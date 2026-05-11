import { ProfileData } from '@/schemas/profile';
import * as SecureStore from 'expo-secure-store';


export async function saveProfileData(data:ProfileData) {
    await SecureStore.setItemAsync("profile_data", JSON.stringify(data))
}

export async function getProfileData() {
    const data = await SecureStore.getItemAsync("profile_data")
    return data ? JSON.parse(data) as ProfileData : data
}