const Logger = require('../utils/logger');
const Booking = require('../database/models/Booking');

class VenueChecker {
    /**
     * Check availability of multiple venues in parallel
     * @param {Array} venues - Array of venue objects
     * @param {string} date - Booking date (YYYY-MM-DD)
     * @param {string} time - Booking time (HH:mm)
     * @param {Function} progressCallback - Callback for progress updates
     * @returns {Array} Array of venues with availability status
     */
    async checkMultipleVenues(venues, date, time, progressCallback = null) {
        Logger.info(`Checking availability for ${venues.length} venues`);

        const promises = venues.map(async (venue, index) => {
            try {
                if (progressCallback) {
                    await progressCallback(venue, 'checking', index);
                }

                const isAvailable = await this.checkAvailability(venue, date, time);
                
                const result = {
                    ...venue,
                    available: isAvailable,
                    checked: true
                };

                if (progressCallback) {
                    await progressCallback(venue, isAvailable ? 'available' : 'full', index);
                }

                return result;
            } catch (error) {
                Logger.error(`Error checking venue ${venue.name}:`, error.message);
                
                if (progressCallback) {
                    await progressCallback(venue, 'error', index);
                }

                return {
                    ...venue,
                    available: false,
                    checked: false,
                    error: error.message
                };
            }
        });

        return await Promise.all(promises);
    }

    /**
     * Check if a venue is available at specific date and time
     * @param {Object} venue - Venue object
     * @param {string} date - Booking date (YYYY-MM-DD)
     * @param {string} time - Booking time (HH:mm)
     * @returns {boolean} True if available
     */
    async checkAvailability(venue, date, time) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        // Check existing bookings in database
        const existingBooking = await this.hasExistingBooking(venue.place_id, date, time);
        if (existingBooking) {
            return false;
        }

        // Check opening hours
        if (venue.opening_hours) {
            const isOpen = this.isOpenAtTime(venue.opening_hours, date, time);
            if (!isOpen) {
                return false;
            }
        }

        // Simulate random availability (80% chance of being available)
        // In real implementation, this would call venue's booking API
        return Math.random() > 0.2;
    }

    async hasExistingBooking(placeId, date, time) {
        try {
            const { query } = require('../database/connection');
            const sql = `
                SELECT COUNT(*) as count 
                FROM bookings 
                WHERE venue_place_id = ? 
                AND booking_date = ? 
                AND booking_time = ?
                AND status IN ('pending', 'confirmed')
            `;
            const results = await query(sql, [placeId, date, time]);
            return results[0].count > 0;
        } catch (error) {
            Logger.error('Error checking existing booking:', error.message);
            return false;
        }
    }

    isOpenAtTime(openingHours, date, time) {
        // Simple check - in real implementation would parse opening hours properly
        if (openingHours.open_now !== undefined) {
            return openingHours.open_now;
        }
        return true;
    }

    /**
     * Get available venues from checked list
     */
    getAvailableVenues(checkedVenues) {
        return checkedVenues.filter(v => v.available && v.checked);
    }

    /**
     * Get unavailable venues from checked list
     */
    getUnavailableVenues(checkedVenues) {
        return checkedVenues.filter(v => !v.available && v.checked);
    }
}

module.exports = VenueChecker;
