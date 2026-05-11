import { FileMetadata } from "./filemetadata";
import { StoreItemExtra } from "./store-item-extras";


export type StoreItem = {
    id: string;
    storeId: string;
    name: string;
    description: string;
    price: number;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
    averageRating: number;
    ratingCount: number;
    photo: FileMetadata;
    isSoldPerUnit: boolean;
    extras?: StoreItemExtra[];
}