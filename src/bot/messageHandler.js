const IntentExtractor = require('../ai/intentExtractor');
const VenueSearch = require('../api/venueSearch');
const AlternativeSearch = require('../services/alternativeSearch');
const RecommendationEngine = require('../services/recommendationEngine');
const BookingService = require('../services/bookingService');
const TelegramNotification = require('../notifications/telegramNotification');
const EmailNotification = require('../notifications/emailNotification');
const GooglePlacesAPI = require('../api/googlePlaces');
const Keyboards = require('./keyboards');
const Logger = require('../utils/logger');
const User = require('../database/models/User');

class MessageHandler {
    constructor(bot) {
        this.bot = bot;
        this.intentExtractor = new IntentExtractor();
        this.venueSearch = new VenueSearch();
        this.alternativeSearch = new AlternativeSearch();
        this.recommendationEngine = new RecommendationEngine();
        this.bookingService = new BookingService();
        this.telegramNotif = new TelegramNotification(bot);
        this.emailNotif = new EmailNotification();
        this.googlePlaces = new GooglePlacesAPI();
        
        // Store conversation states
        this.conversationStates = new Map();
    }

    async handleStart(ctx) {
        const username = ctx.from.username || ctx.from.first_name;
        
        await ctx.reply(
            `Selamat datang di *Sports Venue Booking Bot* 🎾⚽🏀\n\n` +
            `Saya dapat membantu Anda:\n` +
            `✅ Mencari venue olahraga\n` +
            `✅ Memeriksa ketersediaan\n` +
            `✅ Booking venue secara otomatis\n` +
            `✅ Mengirim reminder sebelum booking\n\n` +
            `Cukup kirim pesan seperti:\n` +
            `_"Cari lapangan futsal di Jakarta Selatan besok jam 18:00"_\n\n` +
            `Atau gunakan menu di bawah! 👇`,
            { 
                parse_mode: 'Markdown',
                ...Keyboards.mainMenu()
            }
        );

        // Create or update user
        await User.findOrCreate(ctx.from.id, username);
    }

    async handleHelp(ctx) {
        await ctx.reply(
            `📖 *Panduan Penggunaan*\n\n` +
            `*Cara Booking:*\n` +
            `1. Kirim pesan dengan format natural language\n` +
            `   Contoh: "Cari lapangan badminton di Bandung minggu depan jam 15:00"\n\n` +
            `2. Bot akan mencari venue yang tersedia\n` +
            `3. Pilih venue yang Anda inginkan\n` +
            `4. Konfirmasi booking\n` +
            `5. Selesai! Anda akan menerima notifikasi via Telegram & Email\n\n` +
            `*Olahraga yang Didukung:*\n` +
            `⚽ Futsal, Mini Soccer\n` +
            `🏸 Badminton\n` +
            `🎾 Tennis, Padel\n` +
            `🏀 Basketball\n` +
            `🏐 Volleyball\n\n` +
            `*Perintah Lain:*\n` +
            `/start - Mulai bot\n` +
            `/help - Bantuan\n` +
            `/mybookings - Lihat booking Anda\n` +
            `/cancel - Batalkan pencarian`,
            { parse_mode: 'Markdown' }
        );
    }

    async handleMessage(ctx) {
        const message = ctx.message.text;
        const telegramId = ctx.from.id;

        // Check for menu buttons
        if (message === '🔍 Cari Venue') {
            await ctx.reply(
                'Silakan kirim pesan dengan format:\n' +
                '"Cari [olahraga] di [lokasi] [tanggal] jam [waktu]"\n\n' +
                'Contoh: "Cari lapangan futsal di Jakarta Selatan besok jam 18:00"'
            );
            return;
        }

        if (message === '📋 Booking Saya') {
            await this.handleMyBookings(ctx);
            return;
        }

        if (message === 'ℹ️ Bantuan') {
            await this.handleHelp(ctx);
            return;
        }

        // Process booking request
        await this.processBookingRequest(ctx, message);
    }

    async processBookingRequest(ctx, message) {
        const telegramId = ctx.from.id;

        try {
            // Show processing message
            const processingMsg = await ctx.reply('🔍 Memproses permintaan Anda...');

            // Extract intent
            const intent = await this.intentExtractor.extractIntent(message);
            Logger.info('Extracted intent:', intent);

            // Check if intent is complete
            const missingFields = this.intentExtractor.getMissingFields(intent);
            
            if (missingFields.length > 0) {
                await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
                await ctx.reply(
                    `⚠️ Informasi tidak lengkap. Mohon sebutkan:\n` +
                    missingFields.map(f => `• ${f}`).join('\n') +
                    `\n\nContoh: "Cari lapangan futsal di Jakarta Selatan besok jam 18:00"`
                );
                return;
            }

            // Update processing message
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                processingMsg.message_id,
                null,
                `🔍 Mencari venue ${intent.sport} di ${intent.location}...`
            );

            // Search venues with auto-alternatives
            const progressCallback = async (update) => {
                if (update.type === 'alternative_search') {
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        processingMsg.message_id,
                        null,
                        `🔄 Mencari alternatif venue (percobaan ${update.attempt}/${update.maxAttempts})...`
                    );
                }
            };

            const result = await this.alternativeSearch.searchWithAutoAlternatives(
                intent.sport,
                intent.location,
                intent.date,
                intent.time,
                progressCallback
            );

            // Delete processing message
            await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);

            if (result.available.length === 0) {
                await ctx.reply(
                    '❌ Maaf, tidak ada venue yang tersedia untuk waktu yang Anda pilih.\n\n' +
                    'Coba pilih tanggal atau waktu lain.'
                );
                return;
            }

            // Rank venues
            const rankedVenues = this.recommendationEngine.rankVenues(result.available);

            // Store in conversation state
            this.conversationStates.set(telegramId, {
                intent: intent,
                venues: rankedVenues,
                step: 'venue_selection'
            });

            // Show venue list with scores
            await this.showVenueList(ctx, rankedVenues, intent);

        } catch (error) {
            Logger.error('Error processing booking request:', error);
            await ctx.reply(
                '❌ Terjadi kesalahan saat memproses permintaan Anda.\n' +
                'Silakan coba lagi atau hubungi admin.'
            );
        }
    }

    async showVenueList(ctx, venues, intent) {
        let message = `✅ *Ditemukan ${venues.length} venue tersedia*\n\n`;
        message += `📅 Tanggal: ${intent.date}\n`;
        message += `🕐 Jam: ${intent.time}\n`;
        message += `📍 Lokasi: ${intent.location}\n\n`;
        message += `*Top Rekomendasi:*\n\n`;

        venues.slice(0, 5).forEach((venue, index) => {
            const stars = '⭐'.repeat(Math.round(venue.rating || 0));
            message += `${index + 1}. *${venue.name}*\n`;
            message += `   ${stars} ${venue.rating || 'N/A'} | Score: ${venue.score}/100\n`;
            message += `   📍 ${venue.address}\n\n`;
        });

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Keyboards.venueSelection(venues.slice(0, 5))
        });
    }

    async handleVenueSelection(ctx, placeId) {
        const telegramId = ctx.from.id;
        const state = this.conversationStates.get(telegramId);

        if (!state) {
            await ctx.answerCbQuery('Session expired. Please start again.');
            return;
        }

        const venue = state.venues.find(v => v.place_id === placeId);
        if (!venue) {
            await ctx.answerCbQuery('Venue not found');
            return;
        }

        await ctx.answerCbQuery('Loading venue details...');

        try {
            // Get venue preview with photos and reviews
            const preview = await this.bookingService.getVenuePreview(placeId);
            
            // Send venue details
            let detailMessage = `🏟 *${preview.name}*\n\n`;
            detailMessage += `⭐ Rating: ${preview.rating}/5 (${preview.user_ratings_total} reviews)\n`;
            detailMessage += `📍 ${preview.address}\n`;
            if (preview.phone) detailMessage += `📞 ${preview.phone}\n`;
            if (preview.website) detailMessage += `🌐 ${preview.website}\n`;
            detailMessage += `\n*Top Reviews:*\n`;
            
            preview.reviews.slice(0, 3).forEach(review => {
                const stars = '⭐'.repeat(review.rating);
                detailMessage += `\n${stars} _"${review.text.substring(0, 100)}..."_\n`;
            });

            // Send photo if available
            if (preview.photos && preview.photos.length > 0) {
                const photoUrl = await this.googlePlaces.getPhotoUrl(
                    preview.photos[0].photo_reference,
                    400
                );
                await ctx.replyWithPhoto(photoUrl, {
                    caption: detailMessage,
                    parse_mode: 'Markdown',
                    ...Keyboards.confirmationButtons(`${telegramId}_${placeId}`)
                });
            } else {
                await ctx.reply(detailMessage, {
                    parse_mode: 'Markdown',
                    ...Keyboards.confirmationButtons(`${telegramId}_${placeId}`)
                });
            }

            // Update state
            this.conversationStates.set(telegramId, {
                ...state,
                selectedVenue: venue,
                step: 'confirmation'
            });

        } catch (error) {
            Logger.error('Error showing venue details:', error);
            await ctx.reply('❌ Gagal memuat detail venue. Silakan coba lagi.');
        }
    }

    async handleBookingConfirmation(ctx, bookingData) {
        const [telegramId, placeId] = bookingData.split('_');
        const state = this.conversationStates.get(parseInt(telegramId));

        if (!state || !state.selectedVenue) {
            await ctx.answerCbQuery('Session expired');
            return;
        }

        await ctx.answerCbQuery('Processing booking...');

        try {
            // Create booking
            const booking = await this.bookingService.createBooking(
                parseInt(telegramId),
                state.selectedVenue,
                {
                    sport: state.intent.sport,
                    date: state.intent.date,
                    time: state.intent.time,
                    username: ctx.from.username || ctx.from.first_name
                }
            );

            // Confirm booking
            await this.bookingService.confirmBooking(booking.id);

            // Send notifications
            await this.telegramNotif.sendBookingConfirmation(parseInt(telegramId), booking);
            
            // Send email if user has email
            const user = await User.findByTelegramId(parseInt(telegramId));
            if (user && user.email) {
                await this.emailNotif.sendBookingConfirmation(user.email, booking);
            }

            // Show payment info
            const paymentInfo = this.bookingService.getPaymentInfo(state.selectedVenue);
            await ctx.reply(
                `💳 *Informasi Pembayaran*\n\n` +
                `${paymentInfo.notes}\n\n` +
                `📞 Contact: ${paymentInfo.contact}`,
                { parse_mode: 'Markdown' }
            );

            // Clear state
            this.conversationStates.delete(parseInt(telegramId));

        } catch (error) {
            Logger.error('Error confirming booking:', error);
            await ctx.reply('❌ Gagal membuat booking. Silakan coba lagi.');
        }
    }

    async handleMyBookings(ctx) {
        try {
            const bookings = await this.bookingService.getUserBookings(ctx.from.id);
            
            if (bookings.length === 0) {
                await ctx.reply('Anda belum memiliki booking.');
                return;
            }

            let message = `📋 *Booking Anda:*\n\n`;
            
            bookings.slice(0, 10).forEach((booking, index) => {
                const formatted = this.bookingService.formatBookingDetails(booking);
                const statusEmoji = booking.status === 'confirmed' ? '✅' : 
                                  booking.status === 'cancelled' ? '❌' : '⏳';
                
                message += `${index + 1}. ${statusEmoji} *${formatted.venue}*\n`;
                message += `   📅 ${formatted.date}\n`;
                message += `   🕐 ${formatted.time}\n`;
                message += `   Status: ${formatted.status}\n\n`;
            });

            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            Logger.error('Error getting bookings:', error);
            await ctx.reply('❌ Gagal memuat booking Anda.');
        }
    }
}

module.exports = MessageHandler;
