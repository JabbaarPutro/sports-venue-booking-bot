# 🗄️ Database Documentation

Dokumentasi lengkap schema database, relationships, dan query examples untuk Sports Venue Booking Bot.

## 📑 Daftar Isi

- [Database Schema](#database-schema)
- [Table Relationships](#table-relationships)
- [Common Queries](#common-queries)
- [Indexes](#indexes)
- [Maintenance](#maintenance)

---

## Database Schema

### Database Info

- **Name**: `sports_venue_booking`
- **Charset**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- **Engine**: InnoDB

---

### Table: `users`

Menyimpan informasi user yang menggunakan bot.

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_telegram_id (telegram_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
- `id`: Primary key, auto increment
- `telegram_id`: Unique Telegram user ID (BIGINT untuk support large IDs)
- `username`: Telegram username (optional)
- `email`: Email untuk notifikasi (optional)
- `created_at`: Timestamp saat user pertama kali menggunakan bot
- `updated_at`: Timestamp saat user terakhir diupdate

**Indexes**:
- Primary key pada `id`
- Unique index pada `telegram_id`
- Index pada `telegram_id` untuk faster lookups

---

### Table: `bookings`

Menyimpan semua booking yang dibuat user.

```sql
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    venue_place_id VARCHAR(255) NOT NULL,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT,
    venue_phone VARCHAR(50),
    sport_type VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    reminder_24h_sent BOOLEAN DEFAULT FALSE,
    reminder_3h_sent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_booking_date (booking_date),
    INDEX idx_status (status),
    INDEX idx_venue_place_id (venue_place_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
- `id`: Primary key, auto increment
- `user_id`: Foreign key ke `users` table
- `venue_place_id`: Google Places ID untuk venue
- `venue_name`: Nama venue (cached untuk performa)
- `venue_address`: Alamat venue (cached)
- `venue_phone`: Nomor telepon venue (cached)
- `sport_type`: Jenis olahraga (Futsal, Tennis, dll)
- `booking_date`: Tanggal booking
- `booking_time`: Jam booking
- `status`: Status booking (pending, confirmed, cancelled)
- `reminder_24h_sent`: Flag apakah reminder 24h sudah dikirim
- `reminder_3h_sent`: Flag apakah reminder 3h sudah dikirim
- `notes`: Catatan tambahan (optional)
- `created_at`: Timestamp saat booking dibuat
- `updated_at`: Timestamp saat booking terakhir diupdate

**Indexes**:
- Primary key pada `id`
- Foreign key pada `user_id` → `users(id)`
- Index pada `user_id` untuk faster user bookings lookup
- Index pada `booking_date` untuk reminder queries
- Index pada `status` untuk filtering by status
- Index pada `venue_place_id` untuk checking existing bookings

**Constraints**:
- Foreign key `user_id` dengan `ON DELETE CASCADE` (jika user dihapus, bookings ikut terhapus)

---

### Table: `venues_cache`

Menyimpan cache data venue dari Google Places untuk mengurangi API calls.

```sql
CREATE TABLE venues_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    place_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    rating DECIMAL(2,1),
    phone VARCHAR(50),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    photo_reference VARCHAR(500),
    opening_hours JSON,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_place_id (place_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
- `id`: Primary key, auto increment
- `place_id`: Unique Google Places ID
- `name`: Nama venue
- `address`: Alamat lengkap venue
- `rating`: Rating venue (0.0 - 5.0)
- `phone`: Nomor telepon venue
- `latitude`: Koordinat latitude
- `longitude`: Koordinat longitude
- `photo_reference`: Reference untuk foto dari Google Places
- `opening_hours`: JSON data jam operasional
- `cached_at`: Timestamp saat data dicache

**Indexes**:
- Primary key pada `id`
- Unique index pada `place_id`
- Index pada `rating` untuk sorting by rating

---

### Table: `conversation_states`

Menyimpan state conversation untuk setiap user (temporary data).

```sql
CREATE TABLE conversation_states (
    id INT PRIMARY KEY AUTO_INCREMENT,
    telegram_id BIGINT NOT NULL,
    state VARCHAR(100) NOT NULL,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_telegram_id (telegram_id),
    INDEX idx_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
- `id`: Primary key, auto increment
- `telegram_id`: Telegram user ID
- `state`: State name (e.g., 'venue_selection', 'confirmation')
- `data`: JSON data untuk menyimpan context
- `created_at`: Timestamp saat state dibuat
- `updated_at`: Timestamp saat state terakhir diupdate

**Indexes**:
- Primary key pada `id`
- Index pada `telegram_id` untuk faster lookups
- Index pada `state` untuk filtering

---

## Table Relationships

### ER Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │◄─────┐
│ telegram_id     │      │
│ username        │      │
│ email           │      │
└─────────────────┘      │
                         │
                         │ 1:N
                         │
                  ┌──────┴────────────┐
                  │    bookings       │
                  │───────────────────│
                  │ id (PK)           │
                  │ user_id (FK)      │
                  │ venue_place_id    │
                  │ venue_name        │
                  │ sport_type        │
                  │ booking_date      │
                  │ booking_time      │
                  │ status            │
                  └───────────────────┘

┌─────────────────────┐
│   venues_cache      │
│─────────────────────│
│ id (PK)             │
│ place_id (UNIQUE)   │
│ name                │
│ rating              │
│ latitude/longitude  │
└─────────────────────┘

┌──────────────────────┐
│ conversation_states  │
│──────────────────────│
│ id (PK)              │
│ telegram_id          │
│ state                │
│ data (JSON)          │
└──────────────────────┘
```

### Relationships

1. **users → bookings**: One-to-Many
   - Satu user bisa memiliki banyak bookings
   - Cascade delete: jika user dihapus, bookings ikut terhapus

2. **bookings ↔ venues_cache**: No direct FK
   - Linked via `venue_place_id`
   - Venues cache independent untuk flexibility

3. **users ↔ conversation_states**: No direct FK
   - Linked via `telegram_id`
   - Temporary data, dapat dibersihkan periodic

---

## Common Queries

### User Queries

#### Find or Create User

```sql
-- Check if user exists
SELECT * FROM users WHERE telegram_id = ?;

-- Create new user
INSERT INTO users (telegram_id, username, email) 
VALUES (?, ?, ?)
ON DUPLICATE KEY UPDATE 
  username = VALUES(username), 
  email = VALUES(email);
```

#### Update User Email

```sql
UPDATE users 
SET email = ? 
WHERE telegram_id = ?;
```

#### Get User Stats

```sql
SELECT 
  u.id,
  u.username,
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
  COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
WHERE u.telegram_id = ?
GROUP BY u.id;
```

---

### Booking Queries

#### Create Booking

```sql
INSERT INTO bookings 
(user_id, venue_place_id, venue_name, venue_address, venue_phone,
 sport_type, booking_date, booking_time, status, notes)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?);
```

#### Get User Bookings

```sql
SELECT * FROM bookings 
WHERE user_id = ? 
ORDER BY booking_date DESC, booking_time DESC
LIMIT 10;
```

#### Get Upcoming Bookings

```sql
SELECT * FROM bookings 
WHERE user_id = ? 
  AND booking_date >= CURDATE()
  AND status = 'confirmed'
ORDER BY booking_date ASC, booking_time ASC;
```

#### Check Venue Availability

```sql
SELECT COUNT(*) as count
FROM bookings
WHERE venue_place_id = ?
  AND booking_date = ?
  AND booking_time = ?
  AND status IN ('pending', 'confirmed');
```

#### Get Bookings Needing Reminders

```sql
-- 24-hour reminder
SELECT b.*, u.telegram_id, u.email, u.username
FROM bookings b
JOIN users u ON b.user_id = u.id
WHERE b.status = 'confirmed'
  AND CONCAT(b.booking_date, ' ', b.booking_time) 
      BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
  AND b.reminder_24h_sent = FALSE;

-- 3-hour reminder
SELECT b.*, u.telegram_id, u.email, u.username
FROM bookings b
JOIN users u ON b.user_id = u.id
WHERE b.status = 'confirmed'
  AND CONCAT(b.booking_date, ' ', b.booking_time) 
      BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 HOUR)
  AND b.reminder_3h_sent = FALSE;
```

#### Mark Reminder Sent

```sql
UPDATE bookings 
SET reminder_24h_sent = TRUE 
WHERE id = ?;

UPDATE bookings 
SET reminder_3h_sent = TRUE 
WHERE id = ?;
```

#### Update Booking Status

```sql
UPDATE bookings 
SET status = ? 
WHERE id = ?;
```

#### Cancel Booking

```sql
UPDATE bookings 
SET status = 'cancelled' 
WHERE id = ? AND user_id = ?;
```

---

### Venue Cache Queries

#### Cache Venue Data

```sql
INSERT INTO venues_cache 
(place_id, name, address, rating, phone, latitude, longitude, 
 photo_reference, opening_hours)
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
  cached_at = CURRENT_TIMESTAMP;
```

#### Find Cached Venue

```sql
SELECT * FROM venues_cache 
WHERE place_id = ?;
```

#### Search Cached Venues

```sql
SELECT * FROM venues_cache 
WHERE name LIKE ? OR address LIKE ?
ORDER BY rating DESC
LIMIT 10;
```

#### Clear Old Cache

```sql
DELETE FROM venues_cache 
WHERE cached_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

### Analytics Queries

#### Daily Booking Stats

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM bookings
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### Popular Sports

```sql
SELECT 
  sport_type,
  COUNT(*) as booking_count
FROM bookings
WHERE status = 'confirmed'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY sport_type
ORDER BY booking_count DESC;
```

#### Popular Venues

```sql
SELECT 
  venue_place_id,
  venue_name,
  COUNT(*) as booking_count
FROM bookings
WHERE status = 'confirmed'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY venue_place_id, venue_name
ORDER BY booking_count DESC
LIMIT 10;
```

#### Active Users

```sql
SELECT 
  COUNT(DISTINCT user_id) as active_users
FROM bookings
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## Indexes

### Performance Indexes

**users table**:
```sql
CREATE INDEX idx_telegram_id ON users(telegram_id);
```

**bookings table**:
```sql
CREATE INDEX idx_user_id ON bookings(user_id);
CREATE INDEX idx_booking_date ON bookings(booking_date);
CREATE INDEX idx_status ON bookings(status);
CREATE INDEX idx_venue_place_id ON bookings(venue_place_id);
CREATE INDEX idx_reminders ON bookings(booking_date, booking_time, status, reminder_24h_sent, reminder_3h_sent);
```

**venues_cache table**:
```sql
CREATE INDEX idx_place_id ON venues_cache(place_id);
CREATE INDEX idx_rating ON venues_cache(rating);
CREATE INDEX idx_cached_at ON venues_cache(cached_at);
```

**conversation_states table**:
```sql
CREATE INDEX idx_telegram_id ON conversation_states(telegram_id);
CREATE INDEX idx_state ON conversation_states(state);
```

---

## Maintenance

### Regular Maintenance Tasks

#### Clean Old Conversation States

```sql
-- Delete conversation states older than 24 hours
DELETE FROM conversation_states 
WHERE updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

Jalankan setiap hari via cron job.

#### Clean Old Venue Cache

```sql
-- Delete venue cache older than 7 days
DELETE FROM venues_cache 
WHERE cached_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

Jalankan setiap minggu.

#### Archive Old Bookings

```sql
-- Move old cancelled bookings to archive table (if created)
INSERT INTO bookings_archive 
SELECT * FROM bookings 
WHERE status = 'cancelled' 
  AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

DELETE FROM bookings 
WHERE status = 'cancelled' 
  AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

Jalankan setiap bulan.

#### Optimize Tables

```sql
OPTIMIZE TABLE users;
OPTIMIZE TABLE bookings;
OPTIMIZE TABLE venues_cache;
OPTIMIZE TABLE conversation_states;
```

Jalankan setiap bulan untuk defragment tables.

---

### Backup Strategy

#### Daily Backup

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
mysqldump -u root -p sports_venue_booking > backup_$DATE.sql
```

#### Restore from Backup

```bash
mysql -u root -p sports_venue_booking < backup_20251120.sql
```

---

### Database Size Monitoring

```sql
SELECT 
  table_name AS 'Table',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'sports_venue_booking'
ORDER BY (data_length + index_length) DESC;
```

---

## Security Best Practices

1. **Never store sensitive data** in plain text
2. **Use prepared statements** untuk prevent SQL injection
3. **Regular backups** ke secure location
4. **Limit database user permissions**
5. **Monitor slow queries** dan optimize
6. **Set up replication** untuk high availability (production)

---

**Next**: Baca [DEPLOYMENT.md](DEPLOYMENT.md) untuk deployment guide.
