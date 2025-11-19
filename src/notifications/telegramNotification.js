const Logger = require('../utils/logger');
const moment = require('moment');

class TelegramNotification {
    constructor(bot) {
        this.bot = bot;
    }

    async sendBookingConfirmation(telegramId, booking) {
        try {
            moment.locale('id');
            const date = moment(booking.booking_date).format('dddd, D MMMM YYYY');
            const time = moment(booking.booking_time, 'HH:mm').format('HH:mm');

            const message = `
✅ *Konfirmasi Booking Berhasil*

📋 *Detail Booking:*
🆔 Booking ID: \`${booking.id}\`
🏟 Venue: *${booking.venue_name}*
${booking.sport_type ? `⚽ Olahraga: ${booking.sport_type}` : ''}
📅 Tanggal: ${date}
🕐 Jam: ${time}
📍 Alamat: ${booking.venue_address || '-'}
📞 Telepon: ${booking.venue_phone || '-'}

💡 *Catatan:*
Silakan hubungi venue untuk informasi pembayaran dan konfirmasi ketersediaan.

Terima kasih telah menggunakan layanan kami! 🙏
            `;

            await this.bot.telegram.sendMessage(telegramId, message, {
                parse_mode: 'Markdown'
            });

            Logger.info(`Booking confirmation sent to Telegram: ${telegramId}`);
            return true;
        } catch (error) {
            Logger.error('Error sending Telegram booking confirmation:', error.message);
            return false;
        }
    }

    async sendReminder(telegramId, booking, hoursBefore) {
        try {
            moment.locale('id');
            const date = moment(booking.booking_date).format('dddd, D MMMM YYYY');
            const time = moment(booking.booking_time, 'HH:mm').format('HH:mm');
            
            const reminderType = hoursBefore === 24 ? '1 Hari' : '3 Jam';
            const emoji = hoursBefore === 24 ? '📅' : '⏰';

            const message = `
${emoji} *Reminder: Booking ${reminderType} Lagi*

Hai! Ini adalah pengingat bahwa Anda memiliki booking *${reminderType}* lagi:

🏟 Venue: *${booking.venue_name}*
${booking.sport_type ? `⚽ Olahraga: ${booking.sport_type}` : ''}
📅 Tanggal: ${date}
🕐 Jam: ${time}
📍 Alamat: ${booking.venue_address || '-'}

Jangan lupa untuk datang tepat waktu! 🎯
            `;

            await this.bot.telegram.sendMessage(telegramId, message, {
                parse_mode: 'Markdown'
            });

            Logger.info(`Reminder sent to Telegram: ${telegramId}`);
            return true;
        } catch (error) {
            Logger.error('Error sending Telegram reminder:', error.message);
            return false;
        }
    }

    async sendProgressUpdate(telegramId, update) {
        try {
            await this.bot.telegram.sendMessage(telegramId, update, {
                parse_mode: 'Markdown'
            });
            return true;
        } catch (error) {
            Logger.error('Error sending progress update:', error.message);
            return false;
        }
    }

    async sendVenueList(telegramId, venues) {
        try {
            if (venues.length === 0) {
                await this.bot.telegram.sendMessage(
                    telegramId,
                    '❌ Maaf, tidak ada venue yang tersedia.'
                );
                return true;
            }

            let message = '📋 *Daftar Venue Tersedia:*\n\n';
            
            venues.forEach((venue, index) => {
                const stars = '⭐'.repeat(Math.round(venue.rating || 0));
                message += `${index + 1}. *${venue.name}*\n`;
                message += `   ${stars} ${venue.rating || 'N/A'} (${venue.user_ratings_total || 0} reviews)\n`;
                message += `   📍 ${venue.address || 'Alamat tidak tersedia'}\n`;
                if (venue.available !== undefined) {
                    message += `   ${venue.available ? '✅ Tersedia' : '❌ Penuh'}\n`;
                }
                message += '\n';
            });

            await this.bot.telegram.sendMessage(telegramId, message, {
                parse_mode: 'Markdown'
            });

            return true;
        } catch (error) {
            Logger.error('Error sending venue list:', error.message);
            return false;
        }
    }
}

module.exports = TelegramNotification;
