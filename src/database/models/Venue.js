const { query } = require('../connection');

class Venue {
    static async findByPlaceId(placeId) {
        const sql = 'SELECT * FROM venues_cache WHERE place_id = ?';
        const results = await query(sql, [placeId]);
        return results[0] || null;
    }

    static async create(venueData) {
        const sql = `
            INSERT INTO venues_cache 
            (place_id, name, address, rating, phone, latitude, longitude, photo_reference, opening_hours)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            address = VALUES(address),
            rating = VALUES(rating),
            phone = VALUES(phone),
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            photo_reference = VALUES(photo_reference),
            opening_hours = VALUES(opening_hours),
            cached_at = CURRENT_TIMESTAMP
        `;
        const params = [
            venueData.place_id,
            venueData.name,
            venueData.address || null,
            venueData.rating || null,
            venueData.phone || null,
            venueData.latitude || null,
            venueData.longitude || null,
            venueData.photo_reference || null,
            venueData.opening_hours ? JSON.stringify(venueData.opening_hours) : null
        ];
        
        const result = await query(sql, params);
        return result.insertId || result.affectedRows;
    }

    static async findAll() {
        const sql = 'SELECT * FROM venues_cache ORDER BY rating DESC';
        return await query(sql);
    }

    static async search(searchTerm) {
        const sql = `
            SELECT * FROM venues_cache 
            WHERE name LIKE ? OR address LIKE ?
            ORDER BY rating DESC
        `;
        const term = `%${searchTerm}%`;
        return await query(sql, [term, term]);
    }

    static async clearOldCache(days = 7) {
        const sql = 'DELETE FROM venues_cache WHERE cached_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
        const result = await query(sql, [days]);
        return result.affectedRows;
    }
}

module.exports = Venue;
