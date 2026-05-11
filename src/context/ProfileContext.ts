import { addOneUserWallets } from "@/functions/wallets/add-one-user-wallet";
import { getOneUserWallets } from "@/functions/wallets/get-one-wallet-by-id";
import { ProfileData } from "@/schemas/profile";
import { UserWallet } from "@/schemas/wallets";
import { showToast } from "@/utils/notifications";
import { getProfileData } from "@/utils/profile";
import { useQuery } from "@tanstack/react-query";
import React, { createContext, useContext, useMemo } from "react";




type ProfileContextType = {
    profileData: ProfileData,
    userWallet: UserWallet,
    refreshProfile: () => void,
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
    const [profileData, setProfileData] = React.useState<ProfileData | null>(null)
    const [userWallet, setUserWallet] = React.useState<UserWallet | null>(null)

    const getProfile = async () => {
        const profile = await getProfileData();
        if (profile) {
            setProfileData(profile as ProfileData)
            return
        }
    }

    React.useEffect(() => {
        getProfile()
    }, [])


    async function fetchUserWallet() {
        try {
            const response = await getOneUserWallets(profileData?.id as string)
            return response.data
        } catch (error: any) {
            if (error.statusCode == 404) {
                const _response = await addOneUserWallets()
                return _response.data
            }
            showToast("error", "Failed to load user wallet")
        }
    }
    const fetchUserWalletQuery = useQuery({
        queryKey: ["fetchUserWallet", profileData],
        queryFn: fetchUserWallet,
        enabled: profileData != null
    })
    React.useEffect(() => {
        if (fetchUserWalletQuery.data && fetchUserWalletQuery.status == "success") {
            setUserWallet(fetchUserWalletQuery.data as UserWallet)
        }
    }, [fetchUserWalletQuery.data, fetchUserWalletQuery.status])


    const value = useMemo(
        () => ({
            profileData,
            userWallet,
            refreshProfile: getProfile,
        }),
        [userWallet, profileData]
    );

    return React.createElement(ProfileContext.Provider, { value: value as any }, children);

}

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
