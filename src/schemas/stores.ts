import { GpsLocation } from "@/schemas/shared";
import { FileMetadata } from "@/schemas/filemetadata";

export type Store = {
    id: string;
    name: string;
    address: string;
    gpsLocation: GpsLocation;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
    ratingCount: number;
    averageRating: number;
    isOpen: boolean;
    coverPhoto: FileMetadata;
}