

export type GoogleRoute = {
    routes: {
        distanceMeters: number;
        duration: string;
        polyline: {
            encodedPolyline: string;
        }
    }[]
}