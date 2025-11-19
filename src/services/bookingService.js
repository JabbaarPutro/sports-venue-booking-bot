const Booking = require('../database/models/Booking');
const User = require('../database/models/User');
const GooglePlacesAPI = require('../api/googlePlaces');
const Logger = require('../utils/logger');

class BookingService {
    constructor() {
        this.googlePlaces = new GooglePlacesAPI();
    }

    /**
     * Create a new booking
     */
    async createBooking(telegramId, venueData, bookingData) {
        try {
            Logger.info(`Creating booking for user ${telegramId}`);

            // Find or create user
            const user = await User.findOrCreate(telegramId, bookingData.username);

            // Create booking record
            const bookingId = await Booking.create({
                user_id: user.id,
                venue_place_id: venueData.place_id,
                venue_name: venueData.name,
                venue_address: venueData.address,
                venue_phone: venueData.phone || null,
                sport_type: bookingData.sport,
                booking_date: bookingData.date,
                booking_time: bookingData.time,
                status: 'pending',
                notes: bookingData.notes || null
            });

            Logger.info(`Booking created with ID: ${bookingId}`);
            return await Booking.findById(bookingId);
        } catch (error) {
            Logger.error('Error creating booking:', error.message);
            throw error;
        }
    }

    /**
     * Confirm a booking
     */
    async confirmBooking(bookingId) {
        try {
            await Booking.confirm(bookingId);
            Logger.info(`Booking ${bookingId} confirmed`);
            return await Booking.findById(bookingId);
        } catch (error) {
            Logger.error('Error confirming booking:', error.message);
            throw error;
        }
    }

    /**
     * Cancel a booking
     */
    async cancelBooking(bookingId) {
        try {
            await Booking.cancel(bookingId);
            Logger.info(`Booking ${bookingId} cancelled`);
            return await Booking.findById(bookingId);
        } catch (error) {
            Logger.error('Error cancelling booking:', error.message);
            throw error;
        }
    }

    /**
     * Get user bookings
     */
    async getUserBookings(telegramId) {
        try {
            const user = await User.findByTelegramId(telegramId);
            if (!user) return [];

            return await Booking.findByUserId(user.id);
        } catch (error) {
            Logger.error('Error getting user bookings:', error.message);
            throw error;
        }
    }

    /**
     * Get venue details with reviews for booking confirmation
     */
    async getVenuePreview(placeId) {
        try {
            const details = await this.googlePlaces.getPlaceDetails(placeId);
            
            return {
                name: details.name,
                address: details.formatted_address,
                phone: details.formatted_phone_number,
                rating: details.rating,
                user_ratings_total: details.user_ratings_total,
                reviews: details.reviews ? details.reviews.slice(0, 3) : [],
                photos: details.photos ? details.photos.slice(0, 3) : [],
                website: details.website,
                opening_hours: details.opening_hours,
                price_level: details.price_level
            };
        } catch (error) {
            Logger.error('Error getting venue preview:', error.message);
            throw error;
        }
    }

    /**
     * Format booking details for display
     */
    formatBookingDetails(booking) {
        const moment = require('moment');
        moment.locale('id');

        const date = moment(booking.booking_date).format('dddd, D MMMM YYYY');
        const time = moment(booking.booking_time, 'HH:mm').format('HH:mm');

        return {
            id: booking.id,
            venue: booking.venue_name,
            address: booking.venue_address,
            phone: booking.venue_phone,
            sport: booking.sport_type,
            date: date,
            time: time,
            status: booking.status,
            createdAt: moment(booking.created_at).format('D MMM YYYY HH:mm')
        };
    }

    /**
     * Get payment information (simplified - shows venue contact info)
     */
    getPaymentInfo(venue) {
        return {
            method: 'Hubungi venue langsung',
            contact: venue.phone || 'Lihat di Google Maps',
            notes: 'Silakan hubungi venue untuk informasi harga dan cara pembayaran'
        };
    }
}

module.exports = BookingService;
