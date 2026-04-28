import * as Location from 'expo-location';
import { MAHARASHTRA_DISTRICTS } from '../constants/locations';
import type { MarathiDistrict } from '../types';

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const distanceInKm = (aLat: number, aLon: number, bLat: number, bLon: number) => {
    const earthRadiusKm = 6371;
    const dLat = toRadians(bLat - aLat);
    const dLon = toRadians(bLon - aLon);

    const lat1 = toRadians(aLat);
    const lat2 = toRadians(bLat);

    const sinDlat = Math.sin(dLat / 2);
    const sinDlon = Math.sin(dLon / 2);

    const hav = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlon * sinDlon;
    const arc = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));

    return earthRadiusKm * arc;
};

const findNearestDistrict = (latitude: number, longitude: number): MarathiDistrict => {
    let nearest = MAHARASHTRA_DISTRICTS[0];
    let best = Number.POSITIVE_INFINITY;

    MAHARASHTRA_DISTRICTS.forEach((district) => {
        const distance = distanceInKm(latitude, longitude, district.latitude, district.longitude);

        if (distance < best) {
            nearest = district;
            best = distance;
        }
    });

    return nearest;
};

export const detectNearestDistrict = async (): Promise<MarathiDistrict> => {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
        throw new Error('ठिकाण परवानगी मिळाली नाही. कृपया हाताने जिल्हा निवडा.');
    }

    const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
    });

    return findNearestDistrict(position.coords.latitude, position.coords.longitude);
};
