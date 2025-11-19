const { Markup } = require('telegraf');
const sportsConfig = require('../../config/sports.json');

class Keyboards {
    static mainMenu() {
        return Markup.keyboard([
            ['🔍 Cari Venue', '📋 Booking Saya'],
            ['ℹ️ Bantuan', '⚙️ Pengaturan']
        ]).resize();
    }

    static sportsMenu() {
        const buttons = sportsConfig.sports.map(sport => 
            `${sport.icon} ${sport.name}`
        );
        
        // Arrange in rows of 2
        const rows = [];
        for (let i = 0; i < buttons.length; i += 2) {
            rows.push(buttons.slice(i, i + 2));
        }
        rows.push(['🔙 Kembali']);

        return Markup.keyboard(rows).resize();
    }

    static confirmationButtons(bookingId) {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('✅ Konfirmasi', `confirm_${bookingId}`),
                Markup.button.callback('❌ Batal', `cancel_${bookingId}`)
            ]
        ]);
    }

    static venueSelection(venues) {
        const buttons = venues.map((venue, index) => [
            Markup.button.callback(
                `${index + 1}. ${venue.name} (⭐${venue.rating})`,
                `select_venue_${venue.place_id}`
            )
        ]);
        
        buttons.push([
            Markup.button.callback('🔄 Cari Lagi', 'search_again')
        ]);

        return Markup.inlineKeyboard(buttons);
    }

    static bookingActions(bookingId) {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('📍 Lihat Lokasi', `location_${bookingId}`),
                Markup.button.callback('📞 Hubungi Venue', `contact_${bookingId}`)
            ],
            [
                Markup.button.callback('❌ Batalkan Booking', `cancel_${bookingId}`)
            ]
        ]);
    }

    static yesNo(action) {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('✅ Ya', `yes_${action}`),
                Markup.button.callback('❌ Tidak', `no_${action}`)
            ]
        ]);
    }

    static removeKeyboard() {
        return Markup.removeKeyboard();
    }
}

module.exports = Keyboards;
