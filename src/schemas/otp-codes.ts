
export type OtpTypes = "password_reset" | "account_verification" | "pickup_verification" | "confirm_delivery"

export type OTPCode = {
    id: string;
    code: string;
    userId: string;
    otpType: OtpTypes;
    orderId: string;
    isUsed: boolean;
    expiryDate: string;
    cartItemIds: string[];
    createdAt: string;
    usedAt: string;
}