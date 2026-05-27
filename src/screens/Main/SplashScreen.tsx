import React from "react"
import NetInfo from "@react-native-community/netinfo"
import { getTokens } from "@/utils/tokens"
import { checkUserTokens } from "@/functions/auth/check-token"
import { SafeAreaView } from "react-native-safe-area-context"
import { ImageBackground, Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"


function CustomSplashScreen(props: { navigation: any }) {
    const { navigation } = props
    const [isConnected, setIsConnected] = React.useState<"checking" | "connected" | "disconnected">("checking")
    const [authFailed, setAuthFailed] = React.useState(false)
    const [authSuccess, setAuthSuccess] = React.useState(false)
    const [showModalSheet, setShowModalSheet] = React.useState(false)

    const checkInternet = async () => {
        if (showModalSheet === true) {
            setShowModalSheet(false)
        }

        try {
            const state = await NetInfo.fetch()
            const connected = state?.isInternetReachable ?? false
            if (connected === true) {
                setIsConnected("connected")
            } else {
                setIsConnected("disconnected")
                setShowModalSheet(true)
            }
        } catch (err) {
            setIsConnected("disconnected")
        }
    }

    React.useEffect(() => {
        checkInternet()
    }, [])

    React.useEffect(() => {
        const checkAuth = async () => {
            try {
                const { accessToken, refreshToken } = await getTokens();
                if (accessToken && refreshToken) {
                    // Tokens found, user is authenticated, now check if tokens are valid
                    await checkUserTokens();
                    setAuthSuccess(true)
                } else {
                    // No tokens found, user is not authenticated
                    setAuthFailed(true)
                }
            } catch (error) {
                setAuthFailed(true)
            }
        }

        if (isConnected === "connected") {
            checkAuth()
        }
    }, [isConnected])

    React.useEffect(() => {
        if (authSuccess) {
            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });
        }
    }, [authSuccess])

    React.useEffect(() => {
        if (authFailed) {
            navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
            });
        }
    }, [authFailed])


    return (
        <View style={styles.safeArea}>
            <StatusBar translucent={false} backgroundColor="#801718" barStyle="light-content" />
            <ImageBackground
                source={require('../../../assets/custom-splash-icon.png')}
                resizeMode="stretch"
                style={styles.background}
                imageStyle={styles.backgroundImage}
            >
                <Modal
                    visible={showModalSheet}
                    transparent
                    animationType="fade"
                    onRequestClose={checkInternet}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>No internet connection</Text>
                            <Text style={styles.modalMessage}>
                                We could not reach the network. Please check your connection and try again.
                            </Text>
                            <TouchableOpacity style={styles.retryButton} onPress={checkInternet} activeOpacity={0.85}>
                                <Text style={styles.retryButtonText}>Try again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ImageBackground>
        </View>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#000",
    },
    background: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    backgroundImage: {
        width: "100%",
        height: "100%",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "flex-end",
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    modalCard: {
        backgroundColor: "#ffffff",
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111111",
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 14,
        lineHeight: 20,
        color: "#4b4b4b",
        marginBottom: 16,
    },
    retryButton: {
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111111",
    },
    retryButtonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "700",
    },
})

export default CustomSplashScreen