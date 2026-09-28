import { WorkingHours } from "@/schemas/stores";

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


export function checkWhetherStoreOpenedToday(workingHours: WorkingHours[]) {
	const today = new Date();
	const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

	for (let workingHour of workingHours) {
		if (dayName.toLowerCase() == workingHour.day.toLowerCase()) {
			const getMinutes = (timeStr: string) => {
				const [time, modifier] = timeStr.split(' ');
				let [hours, minutes] = time.split(':').map(Number);
				
				if (modifier === 'PM' && hours !== 12) hours += 12;
				if (modifier === 'AM' && hours === 12) hours = 0;
				
				return hours * 60 + minutes;
			};

			const now = new Date();
			const currentTimeString = now.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});

			if ((getMinutes(currentTimeString) > getMinutes(workingHour.openTime)) && (getMinutes(currentTimeString) < getMinutes(workingHour.closeTime))) {
				return true
			}
		}
	}

	return false
}