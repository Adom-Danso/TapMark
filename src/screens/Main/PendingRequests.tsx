import { useProfile } from "@/context/ProfileContext";
import { searchTempOrders } from "@/functions/orders/search_temp_orders";
import { MainTabParamList, RootStackParamList } from "@/navigation";
import { TempOrders } from "@/schemas/orders";
import { AUTH_COLORS } from "@/theme/theme";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

function RequestCard({
    onClick,
    index,
}: {
    onClick: () => void;
    index: number;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClick}
            style={styles.card}
        >
            <View style={styles.topRow}>
                <Text style={styles.orderId}>
                    Request #{String(index + 1).padStart(3, "0")}
                </Text>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Awaiting Response</Text>
                </View>
            </View>

            <Text style={styles.cardTitle}>
                Seller Consent Required
            </Text>

            <Text style={styles.description}>
                Review this order request and choose whether to accept or decline it.
            </Text>

            <Text style={styles.actionText}>
                Tap to review →
            </Text>
        </TouchableOpacity>
    );
}

export default function PendingRequests() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [requests, setRequests] = React.useState<TempOrders[]>([]);
    const { profileData } = useProfile()

    const fetchRequestsQuery = useQuery({
        queryKey: ['pendingRequests'],
        queryFn: async () => {
            try {
                const response = await searchTempOrders(
                    profileData?.id || null
                )
                return response.data
            } catch (error) {
                throw error
            }
        },
        retry: 2,
    })
    React.useEffect(() => {
        if (fetchRequestsQuery.data && fetchRequestsQuery.status == "success") {
            setRequests(fetchRequestsQuery.data)
        }
    }, [fetchRequestsQuery.data, fetchRequestsQuery.status])

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Pending Requests</Text>
                <Text style={styles.subtitle}>
                    Orders awaiting your response
                </Text>
            </View>

            <View style={styles.content}>
                {
                    requests.map((request, index) => {
                        return (
                            <RequestCard
                                key={index}
                                index={index}
                                onClick={() =>
                                    navigation.navigate("PendingOrder", {
                                        cartId: request.cartId,
                                        temp_order_id: request.id,
                                    })
                                }
                            />
                        );
                    })
                }
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        color: AUTH_COLORS.text,
    },
    subtitle: {
        marginTop: 6,
        fontSize: 15,
        color: AUTH_COLORS.muted,
    },
    content: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: AUTH_COLORS.text,
        marginTop: 12,
    },
    emptyText: {
        marginTop: 6,
        fontSize: 14,
        color: AUTH_COLORS.muted,
        textAlign: "center",
        lineHeight: 20,
    },
    card: {
        width: "100%",
        backgroundColor: "#FFF",
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,

        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 3,

        borderLeftWidth: 5,
        borderLeftColor: "#F59E0B",
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    orderId: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    badge: {
        backgroundColor: "#FEF3C7",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    badgeText: {
        color: "#B45309",
        fontSize: 12,
        fontWeight: "600",
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 6,
    },
    description: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
    },
    actionText: {
        marginTop: 14,
        fontSize: 14,
        fontWeight: "600",
        color: AUTH_COLORS.primary,
    },
});