# 🎯 Sports Venue Booking Bot

Bot Telegram berbasis AI untuk mencari, merekomendasikan, dan booking venue olahraga secara otomatis menggunakan **Google Places API**, **OLLAMA AI**, dan **MySQL**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

## ✨ Fitur Utama

- ✅ **100% Real-Time Google Places** - Semua data venue dari Google API
- ✅ **AI Natural Language Processing** - OLLAMA AI untuk memahami pesan user
- ✅ **Multi-Sport Support** - Tennis, Padel, Futsal, Mini Soccer, Badminton, Basketball, Volleyball
- ✅ **Parallel Check 5 Venue** - Cek ketersediaan 5 venue sekaligus
- ✅ **Auto-Alternative Search** - Bot otomatis cari alternatif jika venue penuh
- ✅ **Review Before Booking** - Tampilkan foto, rating, dan review dari Google Maps
- ✅ **AI Recommendation Engine** - Scoring 0-100 untuk ranking venue
- ✅ **Automated Reminders** - Email & Telegram (1 hari & 3 jam sebelum booking)
- ✅ **Complete Documentation** - Dokumentasi lengkap dalam Bahasa Indonesia

## 🛠️ Tech Stack

- **Backend**: Node.js
- **Bot Framework**: Telegraf (Telegram Bot)
- **AI**: OLLAMA AI (Local LLM)
- **API**: Google Places API
- **Database**: MySQL (XAMPP)
- **Automation**: n8n workflows
- **Email**: Nodemailer
- **Notifications**: Telegram + Email

## 📋 Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- Node.js (v14 atau lebih tinggi)
- MySQL (XAMPP atau MySQL Server)
- OLLAMA AI (terinstall di local)
- Telegram Bot Token (dari @BotFather)
- Google Places API Key (gratis)
- Gmail Account (untuk email notifications)

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/JabbaarPutro/sports-venue-booking-bot.git
cd sports-venue-booking-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

1. Buka XAMPP dan start MySQL
2. Import schema database:

```bash
mysql -u root -p < src/database/migrations/setup.sql
```

Atau buka phpMyAdmin dan jalankan script SQL dari file `src/database/migrations/setup.sql`

### 4. Setup Environment Variables

Copy file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dengan credentials Anda:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
GOOGLE_PLACES_API_KEY=your_google_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sports_venue_booking
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 5. Jalankan Bot

```bash
npm start
```

Atau untuk development dengan auto-reload:

```bash
npm run dev
```

## 📖 Cara Setup Lengkap

Untuk panduan setup lengkap, baca dokumentasi berikut:

- **[SETUP.md](docs/SETUP.md)** - Panduan setup lengkap step-by-step
- **[API.md](docs/API.md)** - Dokumentasi API dan integrasi
- **[DATABASE.md](docs/DATABASE.md)** - Schema database dan queries
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Cara deploy ke production

## 🎮 Cara Menggunakan

### 1. Start Bot

Buka Telegram dan cari bot Anda, lalu ketik:

```
/start
```

### 2. Booking Venue

Kirim pesan dengan format natural language, contoh:

```
Cari lapangan futsal di Jakarta Selatan besok jam 18:00
```

```
Booking badminton court Bandung minggu depan pagi
```

```
Cari venue tennis di Surabaya tanggal 25 November jam 15:00
```

### 3. Pilih Venue

Bot akan menampilkan daftar venue yang tersedia dengan:
- Rating dan jumlah reviews
- Alamat lengkap
- Skor rekomendasi (0-100)
- Status ketersediaan

### 4. Review & Konfirmasi

Bot akan menampilkan:
- 📸 Foto venue
- ⭐ Rating dan reviews
- 📍 Lokasi Google Maps
- 💰 Informasi kontak untuk pembayaran

### 5. Terima Notifikasi

Anda akan menerima:
- ✅ Konfirmasi booking via Telegram & Email
- 📅 Reminder 24 jam sebelum booking
- ⏰ Reminder 3 jam sebelum booking

## 📱 Perintah Bot

- `/start` - Mulai bot
- `/help` - Tampilkan bantuan
- `/mybookings` - Lihat semua booking Anda
- `/cancel` - Batalkan pencarian saat ini

## 🎯 Contoh Workflow

```
User: "Cari lapangan futsal di Jakarta Selatan besok jam 18:00"
  ↓
Bot: [Ekstrak intent dengan OLLAMA AI]
  Sport: Futsal
  Location: Jakarta Selatan
  Date: 2025-11-20
  Time: 18:00
  ↓
Bot: [Cari venue di Google Places]
  Found: 12 venues
  ↓
Bot: [Check 5 venue parallel]
  Venue A: ✅ Available
  Venue B: ❌ Full
  Venue C: ✅ Available
  Venue D: ✅ Available
  Venue E: ❌ Full
  ↓
Bot: [Ranking dengan AI]
  1. Venue D (Score: 95/100)
  2. Venue A (Score: 87/100)
  3. Venue C (Score: 82/100)
  ↓
User: [Pilih Venue D]
  ↓
Bot: [Tampilkan foto, rating, reviews]
  ↓
User: [Konfirmasi booking]
  ↓
Bot: ✅ Booking berhasil!
     📧 Email konfirmasi terkirim
     📱 Notifikasi Telegram terkirim
```

## 🤖 n8n Workflows

Proyek ini menyediakan 4 workflow n8n yang ready-to-import:

1. **1-telegram-webhook.json** - Handle webhook dari Telegram
2. **2-venue-search.json** - Search venue & parallel availability check
3. **3-booking-flow.json** - Proses booking & payment notification
4. **4-reminder-notification.json** - Automated email & Telegram reminders

### Cara Import n8n Workflows:

1. Install n8n: `npm install -g n8n`
2. Jalankan n8n: `n8n start`
3. Buka http://localhost:5678
4. Import workflow dari folder `n8n-workflows/`

## 📊 Database Schema

### Users Table
```sql
- id (INT, PRIMARY KEY)
- telegram_id (BIGINT, UNIQUE)
- username (VARCHAR)
- email (VARCHAR)
- created_at (TIMESTAMP)
```

### Bookings Table
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- venue_place_id (VARCHAR)
- venue_name (VARCHAR)
- sport_type (VARCHAR)
- booking_date (DATE)
- booking_time (TIME)
- status (ENUM: pending, confirmed, cancelled)
- reminder_24h_sent (BOOLEAN)
- reminder_3h_sent (BOOLEAN)
```

### Venues Cache Table
```sql
- id (INT, PRIMARY KEY)
- place_id (VARCHAR, UNIQUE)
- name (VARCHAR)
- address (TEXT)
- rating (DECIMAL)
- latitude/longitude (DECIMAL)
- cached_at (TIMESTAMP)
```

## 🔧 Troubleshooting

### Bot tidak merespon

1. Cek apakah bot sudah running: `npm start`
2. Cek token Telegram di file `.env`
3. Cek log error di console

### Database connection failed

1. Pastikan XAMPP MySQL sudah running
2. Cek credentials database di `.env`
3. Pastikan database sudah dibuat: `sports_venue_booking`

### OLLAMA AI tidak berfungsi

1. Pastikan OLLAMA sudah terinstall dan running
2. Test: `curl http://localhost:11434/api/tags`
3. Pull model: `ollama pull llama2`
4. Jika OLLAMA tidak tersedia, bot akan fallback ke rule-based extraction

### Google Places API error

1. Cek API key di `.env`
2. Pastikan Places API sudah enabled di Google Cloud Console
3. Cek quota API Anda

### Email tidak terkirim

1. Gunakan Gmail App Password, bukan password biasa
2. Enable "Less secure app access" atau gunakan App Password
3. Cek EMAIL_USER dan EMAIL_PASSWORD di `.env`

## 🎓 Dokumentasi Lengkap

- **[SETUP.md](docs/SETUP.md)** - Panduan setup XAMPP, OLLAMA, Telegram Bot, Google API
- **[API.md](docs/API.md)** - Dokumentasi lengkap semua API dan endpoints
- **[DATABASE.md](docs/DATABASE.md)** - Schema database dan query examples
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deploy ke VPS, cloud, atau dedicated server

## 🤝 Contributing

Contributions are welcome! Silakan buat Pull Request atau buka Issue untuk suggestions.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

Created with ❤️ for the sports community in Indonesia

## 🙏 Acknowledgments

- [Telegraf](https://telegraf.js.org/) - Telegram Bot framework
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview)
- [OLLAMA](https://ollama.ai/) - Local LLM
- [n8n](https://n8n.io/) - Workflow automation

---

⭐ Jika project ini bermanfaat, berikan star di GitHub!