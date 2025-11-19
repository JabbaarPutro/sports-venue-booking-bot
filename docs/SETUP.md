# 🔧 Panduan Setup Lengkap

Panduan step-by-step untuk setup Sports Venue Booking Bot dari awal.

## 📑 Daftar Isi

1. [Install Node.js](#1-install-nodejs)
2. [Install dan Setup XAMPP](#2-install-dan-setup-xampp)
3. [Install OLLAMA AI](#3-install-ollama-ai)
4. [Setup Telegram Bot](#4-setup-telegram-bot)
5. [Dapatkan Google Places API Key](#5-dapatkan-google-places-api-key)
6. [Setup Gmail untuk Email Notifications](#6-setup-gmail-untuk-email-notifications)
7. [Clone dan Setup Project](#7-clone-dan-setup-project)
8. [Install n8n (Optional)](#8-install-n8n-optional)

---

## 1. Install Node.js

### Windows

1. Download Node.js dari https://nodejs.org/
2. Pilih versi LTS (Long Term Support)
3. Jalankan installer dan ikuti instruksi
4. Verifikasi instalasi:

```bash
node --version
npm --version
```

### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### macOS

```bash
brew install node
node --version
npm --version
```

---

## 2. Install dan Setup XAMPP

### Download dan Install

1. Download XAMPP dari https://www.apachefriends.org/
2. Pilih versi untuk OS Anda (Windows/Mac/Linux)
3. Jalankan installer
4. Install dengan komponen minimal: Apache + MySQL

### Setup MySQL

1. Buka XAMPP Control Panel
2. Start **Apache** dan **MySQL**
3. Klik **Admin** pada MySQL untuk membuka phpMyAdmin
4. Buat database baru:
   - Nama: `sports_venue_booking`
   - Collation: `utf8mb4_unicode_ci`

### Import Database Schema

#### Melalui phpMyAdmin:

1. Buka phpMyAdmin (http://localhost/phpmyadmin)
2. Pilih database `sports_venue_booking`
3. Klik tab **SQL**
4. Copy-paste isi file `src/database/migrations/setup.sql`
5. Klik **Go**

#### Melalui Command Line:

```bash
cd path/to/xampp/mysql/bin
mysql -u root -p
# Enter password (kosong jika default XAMPP)

# Di MySQL console:
CREATE DATABASE sports_venue_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# Import schema:
mysql -u root -p sports_venue_booking < path/to/setup.sql
```

### Test Koneksi

```bash
mysql -u root -p
USE sports_venue_booking;
SHOW TABLES;
```

Anda harus melihat 4 tables:
- users
- bookings
- venues_cache
- conversation_states

---

## 3. Install OLLAMA AI

OLLAMA adalah Local LLM yang digunakan untuk natural language processing.

### Windows

1. Download dari https://ollama.ai/download
2. Jalankan installer
3. Setelah install, buka Command Prompt atau PowerShell

### macOS

```bash
curl https://ollama.ai/install.sh | sh
```

### Linux

```bash
curl https://ollama.ai/install.sh | sh
```

### Pull Model Llama2

```bash
ollama pull llama2
```

Tunggu hingga download selesai (sekitar 3.8GB).

### Jalankan OLLAMA Server

```bash
ollama serve
```

Server akan running di `http://localhost:11434`

### Test OLLAMA

Buka terminal baru dan test:

```bash
curl http://localhost:11434/api/tags
```

Anda harus melihat list model yang terinstall termasuk `llama2`.

**Catatan**: Bot tetap bisa berjalan tanpa OLLAMA. Jika OLLAMA tidak tersedia, bot akan menggunakan rule-based intent extraction.

---

## 4. Setup Telegram Bot

### Buat Bot dengan BotFather

1. Buka Telegram dan cari `@BotFather`
2. Start chat dan kirim: `/newbot`
3. Ikuti instruksi:
   - Nama bot: `Sports Venue Booking Bot` (atau nama lain)
   - Username bot: harus unik dan diakhiri dengan `bot`, contoh: `myvenuebooking_bot`
4. BotFather akan memberikan **Token**
5. **Simpan token ini**, akan digunakan di `.env`

### Kustomisasi Bot (Optional)

```
/setdescription - Set deskripsi bot
/setabouttext - Set about text
/setuserpic - Upload gambar profil bot
/setcommands - Set command list
```

Command list yang disarankan:

```
start - Mulai bot
help - Tampilkan bantuan
mybookings - Lihat booking saya
cancel - Batalkan pencarian
```

### Test Bot

1. Cari bot Anda di Telegram menggunakan username yang dibuat
2. Kirim `/start`
3. Bot belum akan merespon karena belum di-setup

---

## 5. Dapatkan Google Places API Key

### Buat Google Cloud Project

1. Buka https://console.cloud.google.com/
2. Login dengan Google Account
3. Klik **Select a project** > **New Project**
4. Nama project: `Sports Venue Booking`
5. Klik **Create**

### Enable Places API

1. Di Google Cloud Console, pilih project Anda
2. Menu hamburger > **APIs & Services** > **Library**
3. Cari **Places API**
4. Klik **Enable**
5. Ulangi untuk **Places API (New)** jika tersedia

### Buat API Key

1. Menu hamburger > **APIs & Services** > **Credentials**
2. Klik **+ CREATE CREDENTIALS** > **API key**
3. Copy API key yang dibuat
4. Klik **Edit API key** (ikon pensil)
5. **Restrict key** (recommended):
   - Application restrictions: pilih **None** atau **HTTP referrers** untuk testing
   - API restrictions: pilih **Restrict key**
   - Select APIs: centang **Places API**
6. Klik **Save**

### API Quota (Gratis)

Google Places API menyediakan free tier:
- $200 kredit gratis per bulan
- Places API: $17 per 1000 requests
- Sekitar 11,700 requests gratis per bulan

**Catatan**: Set billing alert agar tidak kena charge!

---

## 6. Setup Gmail untuk Email Notifications

### Buat App Password

1. Buka https://myaccount.google.com/
2. Pilih **Security**
3. Enable **2-Step Verification** jika belum
4. Scroll ke **App passwords**
5. Klik **App passwords**
6. Select app: **Mail**
7. Select device: **Other** (ketik "Sports Venue Bot")
8. Klik **Generate**
9. Copy 16-digit password
10. **Simpan password ini**, akan digunakan di `.env`

**Penting**: Gunakan App Password, BUKAN password Gmail Anda!

---

## 7. Clone dan Setup Project

### Clone Repository

```bash
git clone https://github.com/JabbaarPutro/sports-venue-booking-bot.git
cd sports-venue-booking-bot
```

### Install Dependencies

```bash
npm install
```

### Setup Environment Variables

```bash
cp .env.example .env
```

Edit file `.env` dengan text editor favorit Anda:

```env
# Telegram Bot (dari BotFather)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Google Places API (dari Google Cloud Console)
GOOGLE_PLACES_API_KEY=AIzaSyABC123def456GHI789jkl

# OLLAMA AI (default jika install local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# MySQL Database (XAMPP default)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sports_venue_booking

# Email (Gmail dengan App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # 16-digit app password

# App Config
PORT=3000
NODE_ENV=development
```

### Test Setup

```bash
npm start
```

Jika berhasil, Anda akan melihat:

```
✅ Environment variables validated
✅ Database connected successfully
✅ Telegram bot started successfully
Bot username: @your_bot_username
✅ Reminder jobs scheduled
✅ Application started successfully
```

### Test Bot di Telegram

1. Buka bot Anda di Telegram
2. Kirim `/start`
3. Bot harus merespon dengan welcome message
4. Coba kirim: `Cari lapangan futsal di Jakarta besok jam 18:00`

---

## 8. Install n8n (Optional)

n8n adalah workflow automation tool yang sudah disediakan template-nya.

### Install n8n

```bash
npm install -g n8n
```

### Jalankan n8n

```bash
n8n start
```

n8n akan running di http://localhost:5678

### Import Workflows

1. Buka http://localhost:5678
2. Klik **Workflows** di sidebar
3. Klik **Import from File**
4. Pilih file dari folder `n8n-workflows/`:
   - `1-telegram-webhook.json`
   - `2-venue-search.json`
   - `3-booking-flow.json`
   - `4-reminder-notification.json`
5. Setup credentials untuk:
   - MySQL (XAMPP)
   - Telegram Bot
   - Gmail SMTP

---

## ✅ Verifikasi Setup

Checklist untuk memastikan semua sudah setup dengan benar:

- [ ] Node.js terinstall (v14+)
- [ ] XAMPP MySQL running
- [ ] Database `sports_venue_booking` sudah dibuat
- [ ] Tables sudah diimport (users, bookings, venues_cache, conversation_states)
- [ ] OLLAMA AI terinstall dan model llama2 sudah di-pull (optional)
- [ ] Telegram Bot Token sudah didapat dari BotFather
- [ ] Google Places API Key sudah didapat dan enabled
- [ ] Gmail App Password sudah dibuat
- [ ] File `.env` sudah diisi dengan semua credentials
- [ ] Dependencies sudah diinstall (`npm install`)
- [ ] Bot berjalan tanpa error (`npm start`)
- [ ] Bot merespon di Telegram saat kirim `/start`
- [ ] n8n terinstall dan workflows sudah diimport (optional)

---

## 🆘 Butuh Bantuan?

Jika menemui masalah:

1. Cek [Troubleshooting di README.md](../README.md#troubleshooting)
2. Lihat log error di console
3. Pastikan semua service running (MySQL, OLLAMA)
4. Cek file `.env` sudah benar
5. Buka Issue di GitHub repository

---

**Next**: Baca [API.md](API.md) untuk dokumentasi API lengkap.
