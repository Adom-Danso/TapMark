import { Cart } from "./cart";
import { Payment } from "./payments";
import { User } from "./user";


export type BackendGpsLocation = {
    lat: number;
    lng: number;
}

export type TempOrders = {
    id: string;
    userId: string;
    cartId: string;
    createdAt: string;
    updatedAt: string;
    deliveryAddressGpsLocation: BackendGpsLocation;
    deliveryFee: number;
    serviceFee: number;
    paymentTiming: "upfront" | "cash_on_delivery";
    deliveryInstructions?: string;
}   

export type Order = {
    id: string;
    userId: string;
    cart: Cart;
    createdAt: string;
    updatedAt: string;
    deliveryAddressGpsLocation: BackendGpsLocation;
    deliveryFee: number;
    serviceFee: number;
    paymentTiming: "upfront" | "cash_on_delivery";
    orderStatus: "processing" | "accepted" | "rejected" | "delivered" | "cancelled";
    orderNumber: string;
    isPickedUp: boolean;
    pickupDate: string;
    deliveryDate: string;
    payment: Payment;
    assignedCourierId: string | null;
    courier?: User;
    isOrderCompleted: boolean;
    deliveryInstructions?: string;
}