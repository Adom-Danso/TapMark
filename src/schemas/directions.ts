export type RouteLeg = 'pickup' | 'delivery';

export type GoogleRoute = {
    routes: {
        distanceMeters: number;
        duration: string;
        polyline: {
            encodedPolyline: string;
        }
    }[];
    leg?: RouteLeg | null;
    destination?: { lat: number; lng: number } | null;
    courierLocation?: { lat: number; lng: number } | null;
}
