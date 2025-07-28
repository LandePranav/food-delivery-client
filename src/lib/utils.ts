import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to check if current time is within a product's time slot
export function isWithinTimeSlot(startTime: Date | null, endTime: Date | null, currentTime: Date): boolean {
  // If no time slot is specified, product is always available
  if (!startTime || !endTime) {
    return true;
  }

  // Convert all times to UTC for comparison
  const currentUTC = new Date(currentTime.getTime());
  const startUTC = new Date(startTime.getTime());
  const endUTC = new Date(endTime.getTime());

  // Handle time slots that span across midnight
  if (endUTC < startUTC) {
    // Time slot spans midnight (e.g., 22:00 to 06:00)
    return currentUTC >= startUTC || currentUTC <= endUTC;
  } else {
    // Regular time slot within the same day
    return currentUTC >= startUTC && currentUTC <= endUTC;
  }
}

// Haversine formula to calculate distance between two GPS points in kilometers
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  
  const R = 6371; // Radius of the earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
}
