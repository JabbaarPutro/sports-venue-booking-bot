-- Database Setup for Sports Venue Booking Bot
-- Run this script in your MySQL database (XAMPP)

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS sports_venue_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sports_venue_booking;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_telegram_id (telegram_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
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

-- Venues cache table
CREATE TABLE IF NOT EXISTS venues_cache (
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

-- Conversation state table (untuk tracking conversation flow)
CREATE TABLE IF NOT EXISTS conversation_states (
    id INT PRIMARY KEY AUTO_INCREMENT,
    telegram_id BIGINT NOT NULL,
    state VARCHAR(100) NOT NULL,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_telegram_id (telegram_id),
    INDEX idx_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO users (telegram_id, username, email) VALUES
(123456789, 'testuser', 'test@example.com')
ON DUPLICATE KEY UPDATE username=VALUES(username);

-- Show created tables
SHOW TABLES;
