

export type Rating = {
    id: string;
    orderId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
    targetType: string;
    targetId: string;
    review: string;
    score: number;
}