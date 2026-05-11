import { StoreItem } from "./store-items";

export type CartItemAddition = {
    extraId: string;
    extraName: string;
    pricingMode: 'open_amount' | 'per_unit' | 'flat_fee';
    unitPrice?: number;
    quantity?: number;
    amount?: number;
}

export type CartItem = {
    id: string;
    cartId: string;
    itemId: string;
    storeItem: StoreItem;
    itemAmount: number;
    quantity: number;
    isPickupComplete: boolean;
    additions: CartItemAddition[];
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
    note?: string;
}