const { query } = require('../connection');

class User {
    static async findByTelegramId(telegramId) {
        const sql = 'SELECT * FROM users WHERE telegram_id = ?';
        const results = await query(sql, [telegramId]);
        return results[0] || null;
    }

    static async create(telegramId, username, email = null) {
        const sql = 'INSERT INTO users (telegram_id, username, email) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE username = ?, email = ?';
        const result = await query(sql, [telegramId, username, email, username, email]);
        return result.insertId;
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        
        if (data.username) {
            fields.push('username = ?');
            values.push(data.username);
        }
        if (data.email) {
            fields.push('email = ?');
            values.push(data.email);
        }
        
        if (fields.length === 0) return false;
        
        values.push(id);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        await query(sql, values);
        return true;
    }

    static async findOrCreate(telegramId, username, email = null) {
        let user = await this.findByTelegramId(telegramId);
        if (!user) {
            const userId = await this.create(telegramId, username, email);
            user = await this.findByTelegramId(telegramId);
        }
        return user;
    }
}

module.exports = User;
