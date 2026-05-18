export type GpsPoint = {
	lat: number;
	lng: number;
};

const EARTH_RADIUS_METERS = 6371000;

export function getGpsDistanceInMeters(
	pointA: GpsPoint,
	pointB: GpsPoint
): number {
	const latitude1 = (pointA.lat * Math.PI) / 180;
	const latitude2 = (pointB.lat * Math.PI) / 180;
	const latitudeDifference = ((pointB.lat - pointA.lat) * Math.PI) / 180;
	const longitudeDifference = ((pointB.lng - pointA.lng) * Math.PI) / 180;

	const a =
		Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
		Math.cos(latitude1) *
			Math.cos(latitude2) *
			Math.sin(longitudeDifference / 2) *
			Math.sin(longitudeDifference / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return EARTH_RADIUS_METERS * c;
}


export function generateImageUrl(imagePath: string) {
	if (!imagePath) {
		return '';
	}

	if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
		return imagePath;
	}

	const normalizedPath = imagePath.replace(/\\/g, '/');
	const photosIndex = normalizedPath.indexOf('photos');
	const trimmedPath = photosIndex >= 0 ? normalizedPath.slice(photosIndex) : normalizedPath.replace(/^\.?\/?/, '');
	return `${process.env.EXPO_PUBLIC_BACKEND_URL}/${trimmedPath}`;
}