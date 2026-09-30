import { GpsLocation } from "@/schemas/shared";
import { FileMetadata } from "@/schemas/filemetadata";

export type WorkingHours = {
    [day: string]: {
        open: string; // e.g., "08:00am"
        closes: string; // e.g., "8:00pm"
    };
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
    searchMatchType: "both" | "item" | "store";
}