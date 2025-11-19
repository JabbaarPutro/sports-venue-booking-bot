const { query } = require('../connection');

class Booking {
    static async create(bookingData) {
        const sql = `
            INSERT INTO bookings 
            (user_id, venue_place_id, venue_name, venue_address, venue_phone, 
             sport_type, booking_date, booking_time, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            bookingData.user_id,
            bookingData.venue_place_id,
            bookingData.venue_name,
            bookingData.venue_address || null,
            bookingData.venue_phone || null,
            bookingData.sport_type,
            bookingData.booking_date,
            bookingData.booking_time,
            bookingData.status || 'pending',
            bookingData.notes || null
        ];
        
        const result = await query(sql, params);
        return result.insertId;
    }

    static async findById(id) {
        const sql = 'SELECT * FROM bookings WHERE id = ?';
        const results = await query(sql, [id]);
        return results[0] || null;
    }

    static async findByUserId(userId) {
        const sql = 'SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_date DESC, booking_time DESC';
        return await query(sql, [userId]);
    }

    static async updateStatus(id, status) {
        const sql = 'UPDATE bookings SET status = ? WHERE id = ?';
        await query(sql, [status, id]);
        return true;
    }

    static async setReminderSent(id, reminderType) {
        const field = reminderType === '24h' ? 'reminder_24h_sent' : 'reminder_3h_sent';
        const sql = `UPDATE bookings SET ${field} = TRUE WHERE id = ?`;
        await query(sql, [id]);
        return true;
    }

    static async getUpcomingBookingsForReminder(hours) {
        const sql = `
            SELECT b.*, u.telegram_id, u.email, u.username
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.status = 'confirmed'
            AND CONCAT(b.booking_date, ' ', b.booking_time) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? HOUR)
            AND (
                (? = 24 AND b.reminder_24h_sent = FALSE) OR
                (? = 3 AND b.reminder_3h_sent = FALSE)
            )
        `;
        return await query(sql, [hours, hours, hours]);
    }

    static async cancel(id) {
        return await this.updateStatus(id, 'cancelled');
    }

    static async confirm(id) {
        return await this.updateStatus(id, 'confirmed');
    }
}

module.exports = Booking;
