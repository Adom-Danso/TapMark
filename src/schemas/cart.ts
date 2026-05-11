import { CartItem } from "./cart-items";


export type Cart = {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
    isOrderCompleted: boolean;
    cartItems: CartItem[];
}

export type CartInvoice = {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    totalAmount: number;
}