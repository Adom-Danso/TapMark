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


export function parseWorkingHoursTime(value: string): number | null {
	if (typeof value !== 'string') {
		return null;
	}

	const match = /^\s*(\d{1,2}):(\d{1,2})\s*(am|pm)?\s*$/i.exec(value);
	if (!match) {
		return null;
	}

	let hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (minutes > 59) {
		return null;
	}

	const modifier = match[3]?.toLowerCase();
	if (modifier) {
		if (hours < 1 || hours > 12) {
			return null;
		}
		if (modifier === 'pm' && hours !== 12) hours += 12;
		if (modifier === 'am' && hours === 12) hours = 0;
	} else if (hours > 23) {
		return null;
	}

	return hours * 60 + minutes;
}

export function checkWhetherStoreOpenedToday(workingHours: WorkingHours[]) {
	const today = new Date();
	const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

	for (const entry of workingHours) {
		const [day, hours] = Object.entries(entry)[0] ?? [];
		if (!day || !hours) {
			continue;
		}

		if (day.toLowerCase() !== dayName) {
			continue;
		}

		const openMinutes = parseWorkingHoursTime(hours.open);
		const closeMinutes = parseWorkingHoursTime(hours.closes);
		if (openMinutes === null || closeMinutes === null) {
			return false;
		}

		const now = new Date();
		const nowMinutes = now.getHours() * 60 + now.getMinutes();

		return nowMinutes > openMinutes && nowMinutes < closeMinutes;
	}

	return false;
}