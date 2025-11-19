const VenueSearch = require('../api/venueSearch');
const VenueChecker = require('./venueChecker');
const Logger = require('../utils/logger');

class AlternativeSearch {
    constructor() {
        this.venueSearch = new VenueSearch();
        this.venueChecker = new VenueChecker();
    }

    /**
     * Auto-search for alternative venues if initial search returns no available venues
     * @param {string} sport - Sport type
     * @param {string} location - Location
     * @param {string} date - Booking date
     * @param {string} time - Booking time
     * @param {Array} checkedVenues - Already checked venues
     * @param {Function} progressCallback - Callback for updates
     * @returns {Array} Available venues
     */
    async findAlternatives(sport, location, date, time, checkedVenues = [], progressCallback = null) {
        Logger.info('Starting alternative venue search');

        const maxAttempts = 3;
        const checkedPlaceIds = new Set(checkedVenues.map(v => v.place_id));
        let allAvailableVenues = [];

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (progressCallback) {
                await progressCallback({
                    type: 'alternative_search',
                    attempt: attempt,
                    maxAttempts: maxAttempts
                });
            }

            // Search for more venues
            const moreVenues = await this.venueSearch.searchWithAlternatives(
                sport,
                location,
                { limit: 5, minRating: 3.5 - (attempt * 0.3) } // Lower rating threshold on each attempt
            );

            // Filter out already checked venues
            const newVenues = moreVenues.filter(v => !checkedPlaceIds.has(v.place_id));

            if (newVenues.length === 0) {
                Logger.warn(`No new venues found in attempt ${attempt}`);
                continue;
            }

            // Check availability of new venues
            const checkedNewVenues = await this.venueChecker.checkMultipleVenues(
                newVenues,
                date,
                time,
                progressCallback
            );

            // Add to checked set
            checkedNewVenues.forEach(v => checkedPlaceIds.add(v.place_id));

            // Get available venues
            const availableVenues = this.venueChecker.getAvailableVenues(checkedNewVenues);
            allAvailableVenues = allAvailableVenues.concat(availableVenues);

            // If we found available venues, return them
            if (availableVenues.length > 0) {
                Logger.info(`Found ${availableVenues.length} alternative venues in attempt ${attempt}`);
                return allAvailableVenues;
            }
        }

        Logger.warn('No alternative venues found after all attempts');
        return allAvailableVenues;
    }

    /**
     * Search with automatic fallback to alternatives
     */
    async searchWithAutoAlternatives(sport, location, date, time, progressCallback = null) {
        // Initial search
        const initialVenues = await this.venueSearch.search(sport, location, { limit: 5 });

        if (initialVenues.length === 0) {
            Logger.warn('No venues found in initial search');
            return { available: [], unavailable: [] };
        }

        // Check availability
        const checkedVenues = await this.venueChecker.checkMultipleVenues(
            initialVenues,
            date,
            time,
            progressCallback
        );

        const availableVenues = this.venueChecker.getAvailableVenues(checkedVenues);
        
        // If no available venues, search for alternatives
        if (availableVenues.length === 0) {
            if (progressCallback) {
                await progressCallback({
                    type: 'no_available',
                    message: 'Tidak ada venue tersedia, mencari alternatif...'
                });
            }

            const alternatives = await this.findAlternatives(
                sport,
                location,
                date,
                time,
                checkedVenues,
                progressCallback
            );

            return {
                available: alternatives,
                unavailable: checkedVenues.filter(v => !v.available)
            };
        }

        return {
            available: availableVenues,
            unavailable: checkedVenues.filter(v => !v.available)
        };
    }
}

module.exports = AlternativeSearch;
