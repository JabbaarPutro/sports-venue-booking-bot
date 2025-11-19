class DistanceCalculator {
    /**
     * Calculate distance between two points using Haversine formula
     * @param {number} lat1 - Latitude of point 1
     * @param {number} lon1 - Longitude of point 1
     * @param {number} lat2 - Latitude of point 2
     * @param {number} lon2 - Longitude of point 2
     * @returns {number} Distance in kilometers
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Convert degrees to radians
     */
    static toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Calculate distance score for recommendation engine (0-100)
     * Closer venues get higher scores
     */
    static getDistanceScore(distanceKm, maxDistance = 20) {
        if (distanceKm >= maxDistance) return 0;
        return Math.round((1 - (distanceKm / maxDistance)) * 100);
    }

    /**
     * Format distance for display
     */
    static formatDistance(distanceKm) {
        if (distanceKm < 1) {
            return `${Math.round(distanceKm * 1000)} m`;
        }
        return `${distanceKm} km`;
    }

    /**
     * Get distance category
     */
    static getDistanceCategory(distanceKm) {
        if (distanceKm < 2) return 'Sangat Dekat';
        if (distanceKm < 5) return 'Dekat';
        if (distanceKm < 10) return 'Sedang';
        if (distanceKm < 20) return 'Jauh';
        return 'Sangat Jauh';
    }
}

module.exports = DistanceCalculator;
