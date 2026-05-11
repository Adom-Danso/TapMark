import { FileMetadata } from "./filemetadata";


export type StoreItemExtra = {
    id: string;
    storeItemId: string;
    unitPrice: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    photo: FileMetadata;
    isPackaging: boolean;
    isSoldPerUnit: boolean;
    isDeleted: boolean;
}