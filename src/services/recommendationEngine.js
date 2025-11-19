const DistanceCalculator = require('../utils/distanceCalculator');
const Logger = require('../utils/logger');

class RecommendationEngine {
    /**
     * Score and rank venues based on multiple factors
     * @param {Array} venues - Array of venue objects with availability
     * @param {Object} userLocation - User's location {lat, lng}
     * @param {Object} preferences - User preferences
     * @returns {Array} Ranked venues with scores
     */
    rankVenues(venues, userLocation = null, preferences = {}) {
        Logger.info(`Ranking ${venues.length} venues`);

        const scoredVenues = venues.map(venue => {
            const score = this.calculateScore(venue, userLocation, preferences);
            return {
                ...venue,
                score: score,
                scoreBreakdown: this.getScoreBreakdown(venue, userLocation, preferences)
            };
        });

        // Sort by score (highest first)
        scoredVenues.sort((a, b) => b.score - a.score);

        Logger.info('Venues ranked successfully');
        return scoredVenues;
    }

    /**
     * Calculate overall score (0-100)
     * Formula: (rating * 30) + (distance_score * 25) + (availability * 25) + (reviews_count * 20)
     */
    calculateScore(venue, userLocation, preferences = {}) {
        let score = 0;

        // Rating score (30 points max)
        const ratingScore = this.getRatingScore(venue.rating);
        score += ratingScore;

        // Distance score (25 points max)
        const distanceScore = this.getDistanceScore(venue, userLocation);
        score += distanceScore;

        // Availability score (25 points max)
        const availabilityScore = venue.available ? 25 : 0;
        score += availabilityScore;

        // Reviews count score (20 points max)
        const reviewsScore = this.getReviewsCountScore(venue.user_ratings_total);
        score += reviewsScore;

        // Apply preference multipliers
        if (preferences.preferHighRating && venue.rating >= 4.5) {
            score *= 1.1;
        }
        if (preferences.preferNearby && distanceScore >= 20) {
            score *= 1.05;
        }

        return Math.min(Math.round(score), 100);
    }

    getRatingScore(rating) {
        if (!rating) return 0;
        return (rating / 5) * 30;
    }

    getDistanceScore(venue, userLocation) {
        if (!userLocation || !venue.latitude || !venue.longitude) {
            return 12.5; // Default middle score
        }

        const distance = DistanceCalculator.calculateDistance(
            userLocation.lat,
            userLocation.lng,
            venue.latitude,
            venue.longitude
        );

        const distanceScore = DistanceCalculator.getDistanceScore(distance, 20);
        return (distanceScore / 100) * 25;
    }

    getReviewsCountScore(reviewsCount) {
        if (!reviewsCount) return 0;
        
        // Logarithmic scale for reviews count
        // 0 reviews = 0 points
        // 10 reviews = 5 points
        // 50 reviews = 10 points
        // 100 reviews = 12 points
        // 500+ reviews = 20 points
        
        if (reviewsCount >= 500) return 20;
        if (reviewsCount >= 200) return 18;
        if (reviewsCount >= 100) return 15;
        if (reviewsCount >= 50) return 12;
        if (reviewsCount >= 20) return 8;
        if (reviewsCount >= 10) return 5;
        return Math.min((reviewsCount / 10) * 5, 5);
    }

    getScoreBreakdown(venue, userLocation, preferences = {}) {
        return {
            rating: this.getRatingScore(venue.rating),
            distance: this.getDistanceScore(venue, userLocation),
            availability: venue.available ? 25 : 0,
            reviews: this.getReviewsCountScore(venue.user_ratings_total)
        };
    }

    /**
     * Get top N recommended venues
     */
    getTopRecommendations(venues, userLocation, n = 3) {
        const ranked = this.rankVenues(venues, userLocation);
        return ranked.slice(0, n);
    }

    /**
     * Format recommendation for display
     */
    formatRecommendation(venue, rank) {
        const stars = '⭐'.repeat(Math.round(venue.rating || 0));
        const scoreBar = this.getScoreBar(venue.score);
        
        return {
            rank: rank,
            name: venue.name,
            rating: venue.rating,
            stars: stars,
            score: venue.score,
            scoreBar: scoreBar,
            address: venue.address,
            available: venue.available,
            reviewsCount: venue.user_ratings_total || 0
        };
    }

    getScoreBar(score) {
        const bars = Math.round(score / 10);
        return '█'.repeat(bars) + '░'.repeat(10 - bars);
    }
}

module.exports = RecommendationEngine;
