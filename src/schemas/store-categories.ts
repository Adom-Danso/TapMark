import { FileMetadata } from "./filemetadata";


export type StoreCategories = {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    isDeleted: string;
    photo: FileMetadata
}