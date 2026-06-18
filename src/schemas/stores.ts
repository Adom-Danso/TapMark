import { GpsLocation } from "@/schemas/shared";
import { FileMetadata } from "@/schemas/filemetadata";

export type WorkingHours = {
    day: string; // e.g., "monday", "tuesday", etc.
    openTime: string; // e.g., "09:00"
    closeTime: string; // e.g., "17:00"
}

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
    workingHours: WorkingHours[];
    isAvailableOnHolidays: boolean;
}