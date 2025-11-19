const axios = require('axios');
const Logger = require('../utils/logger');

class GooglePlacesAPI {
    constructor() {
        this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
        this.baseUrl = 'https://maps.googleapis.com/maps/api';
    }

    async searchVenues(sport, location, options = {}) {
        try {
            const query = `${sport} ${location}`;
            Logger.info(`Searching venues for: ${query}`);

            const response = await axios.get(`${this.baseUrl}/place/textsearch/json`, {
                params: {
                    query: query,
                    key: this.apiKey,
                    language: 'id',
                    ...options
                }
            });

            if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                Logger.error('Google Places API error:', response.data.status);
                throw new Error(`Google Places API error: ${response.data.status}`);
            }

            return response.data.results || [];
        } catch (error) {
            Logger.error('Error searching venues:', error.message);
            throw error;
        }
    }

    async getPlaceDetails(placeId) {
        try {
            const response = await axios.get(`${this.baseUrl}/place/details/json`, {
                params: {
                    place_id: placeId,
                    fields: 'name,formatted_address,formatted_phone_number,rating,reviews,photos,opening_hours,geometry,price_level,website',
                    key: this.apiKey,
                    language: 'id'
                }
            });

            if (response.data.status !== 'OK') {
                Logger.error('Google Places API error:', response.data.status);
                throw new Error(`Google Places API error: ${response.data.status}`);
            }

            return response.data.result;
        } catch (error) {
            Logger.error('Error getting place details:', error.message);
            throw error;
        }
    }

    async getPhotoUrl(photoReference, maxWidth = 400) {
        if (!photoReference) return null;
        return `${this.baseUrl}/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
    }

    parseVenue(place) {
        return {
            place_id: place.place_id,
            name: place.name,
            address: place.formatted_address || place.vicinity,
            rating: place.rating || 0,
            user_ratings_total: place.user_ratings_total || 0,
            latitude: place.geometry?.location?.lat,
            longitude: place.geometry?.location?.lng,
            photo_reference: place.photos?.[0]?.photo_reference || null,
            opening_hours: place.opening_hours,
            price_level: place.price_level,
            types: place.types || []
        };
    }

    filterVenues(venues, options = {}) {
        const {
            minRating = 4.0,
            maxDistance = 20,
            userLocation = null
        } = options;

        let filtered = venues.filter(venue => {
            // Filter by rating
            if (venue.rating < minRating) return false;
            
            // Filter by operational status
            if (venue.opening_hours && venue.opening_hours.open_now === false) {
                return false;
            }

            return true;
        });

        // Sort by rating and user ratings count
        filtered.sort((a, b) => {
            const scoreA = (a.rating || 0) * Math.log10((a.user_ratings_total || 1) + 1);
            const scoreB = (b.rating || 0) * Math.log10((b.user_ratings_total || 1) + 1);
            return scoreB - scoreA;
        });

        return filtered;
    }
}

module.exports = GooglePlacesAPI;
