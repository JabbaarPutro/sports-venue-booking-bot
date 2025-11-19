const GooglePlacesAPI = require('./googlePlaces');
const DistanceCalculator = require('../utils/distanceCalculator');
const Venue = require('../database/models/Venue');
const Logger = require('../utils/logger');

class VenueSearch {
    constructor() {
        this.googlePlaces = new GooglePlacesAPI();
    }

    async search(sport, location, options = {}) {
        Logger.info(`Searching venues: ${sport} in ${location}`);

        try {
            // Search venues from Google Places
            const venues = await this.googlePlaces.searchVenues(sport, location);
            
            if (venues.length === 0) {
                Logger.warn('No venues found');
                return [];
            }

            // Parse and filter venues
            const parsedVenues = venues.map(v => this.googlePlaces.parseVenue(v));
            const filteredVenues = this.googlePlaces.filterVenues(parsedVenues, options);

            // Cache venues in database
            for (const venue of filteredVenues) {
                try {
                    await Venue.create(venue);
                } catch (error) {
                    Logger.warn('Error caching venue:', error.message);
                }
            }

            // Return top venues
            const limit = options.limit || 5;
            return filteredVenues.slice(0, limit);
        } catch (error) {
            Logger.error('Venue search error:', error.message);
            throw error;
        }
    }

    async getVenueDetails(placeId) {
        try {
            // Check cache first
            let venue = await Venue.findByPlaceId(placeId);
            
            if (!venue) {
                // Fetch from Google Places API
                const details = await this.googlePlaces.getPlaceDetails(placeId);
                venue = this.googlePlaces.parseVenue(details);
                
                // Cache it
                await Venue.create(venue);
            }

            return venue;
        } catch (error) {
            Logger.error('Error getting venue details:', error.message);
            throw error;
        }
    }

    async searchWithAlternatives(sport, location, options = {}) {
        const maxAttempts = options.maxAttempts || 3;
        const limit = options.limit || 5;
        let allVenues = [];
        let pageToken = null;

        for (let attempt = 0; attempt < maxAttempts && allVenues.length < limit * maxAttempts; attempt++) {
            const searchOptions = pageToken ? { pagetoken: pageToken } : {};
            const venues = await this.googlePlaces.searchVenues(sport, location, searchOptions);
            
            if (venues.length === 0) break;

            const parsedVenues = venues.map(v => this.googlePlaces.parseVenue(v));
            allVenues = allVenues.concat(parsedVenues);

            // Check if there's a next page
            pageToken = venues.next_page_token || null;
            if (!pageToken) break;

            // Wait a bit before fetching next page (Google API requirement)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Filter and sort all venues
        const filteredVenues = this.googlePlaces.filterVenues(allVenues, options);
        return filteredVenues;
    }

    calculateVenueScore(venue, userLocation = null) {
        let score = 0;

        // Rating score (30 points)
        const ratingScore = (venue.rating / 5) * 30;
        score += ratingScore;

        // Distance score (25 points)
        let distanceScore = 0;
        if (userLocation && venue.latitude && venue.longitude) {
            const distance = DistanceCalculator.calculateDistance(
                userLocation.lat,
                userLocation.lng,
                venue.latitude,
                venue.longitude
            );
            distanceScore = DistanceCalculator.getDistanceScore(distance, 20);
            score += (distanceScore / 100) * 25;
        } else {
            score += 12.5; // Default middle score if no location
        }

        // Availability score (25 points) - would be checked later
        score += 12.5; // Default middle score

        // Reviews count score (20 points)
        const reviewsScore = Math.min((venue.user_ratings_total / 100) * 20, 20);
        score += reviewsScore;

        return Math.round(score);
    }
}

module.exports = VenueSearch;
