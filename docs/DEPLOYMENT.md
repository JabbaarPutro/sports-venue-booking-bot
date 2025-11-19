# 🚀 Deployment Guide

Panduan lengkap untuk deploy Sports Venue Booking Bot ke production.

## 📑 Daftar Isi

- [Deployment Options](#deployment-options)
- [Pre-deployment Checklist](#pre-deployment-checklist)
- [Deploy to VPS (Ubuntu)](#deploy-to-vps-ubuntu)
- [Deploy with PM2](#deploy-with-pm2)
- [Deploy with Docker](#deploy-with-docker)
- [Security Hardening](#security-hardening)
- [Monitoring & Logging](#monitoring--logging)
- [Backup Strategy](#backup-strategy)

---

## Deployment Options

### 1. VPS (Recommended)
- **Pros**: Full control, affordable, scalable
- **Cons**: Requires server management
- **Recommended**: DigitalOcean, Linode, Vultr, AWS Lightsail
- **Cost**: $5-20/month

### 2. Heroku
- **Pros**: Easy deployment, free tier available
- **Cons**: Limited resources, cold starts
- **Cost**: Free - $25/month

### 3. Railway
- **Pros**: Modern, easy deployment, generous free tier
- **Cons**: Less control than VPS
- **Cost**: Free - $10/month

### 4. Dedicated Server
- **Pros**: Maximum performance
- **Cons**: Expensive, overkill for most cases
- **Cost**: $50+/month

---

## Pre-deployment Checklist

### ✅ Prerequisites

- [ ] VPS atau hosting dengan Node.js support
- [ ] MySQL database (atau MySQL hosting)
- [ ] Domain name (optional tapi recommended)
- [ ] SSL certificate (optional, untuk webhooks)
- [ ] All API keys ready (Telegram, Google Places, Google Gemini, Email)

### ✅ Environment Preparation

- [ ] Update all packages: `npm update`
- [ ] Test locally: `npm start`
- [ ] Check all environment variables
- [ ] Test database connection
- [ ] Test email notifications
- [ ] Test Telegram bot

### ✅ Security

- [ ] Never commit `.env` file
- [ ] Use strong database passwords
- [ ] Enable firewall
- [ ] Set up fail2ban (VPS)
- [ ] Regular security updates

---

## Deploy to VPS (Ubuntu)

### Step 1: Setup VPS

#### Create VPS

1. Create Ubuntu 22.04 LTS droplet/instance
2. Minimum specs: 1GB RAM, 1 CPU, 25GB storage
3. Note down IP address

#### Initial Server Setup

```bash
# SSH ke server
ssh root@your_server_ip

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser botuser
usermod -aG sudo botuser

# Switch to new user
su - botuser
```

### Step 2: Install Dependencies

#### Install Node.js

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

#### Install MySQL

```bash
# Install MySQL Server
sudo apt install mysql-server -y

# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p

# In MySQL console:
CREATE DATABASE sports_venue_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'botuser'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON sports_venue_booking.* TO 'botuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Step 3: Deploy Application

#### Clone Repository

```bash
cd ~
git clone https://github.com/JabbaarPutro/sports-venue-booking-bot.git
cd sports-venue-booking-bot
```

#### Install Dependencies

```bash
npm install --production
```

#### Setup Environment

```bash
cp .env.example .env
nano .env
```

Edit `.env` dengan production values:

```env
TELEGRAM_BOT_TOKEN=your_production_token
GOOGLE_PLACES_API_KEY=your_api_key
GEMINI_API_KEY=your_gemini_api_key
DB_HOST=localhost
DB_PORT=3306
DB_USER=botuser
DB_PASSWORD=strong_password_here
DB_NAME=sports_venue_booking
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
PORT=3000
NODE_ENV=production
```

#### Import Database Schema

```bash
mysql -u botuser -p sports_venue_booking < src/database/migrations/setup.sql
```

#### Test Application

```bash
npm start
```

Test bot di Telegram. Jika berfungsi, stop dengan `Ctrl+C`.

### Step 4: Setup PM2

#### Start Application with PM2

```bash
pm2 start src/index.js --name sports-bot

# View logs
pm2 logs sports-bot

# Check status
pm2 status
```

#### Configure Auto-restart

```bash
# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Copy and run the command provided by PM2
```

#### PM2 Monitoring

```bash
# Monitor in real-time
pm2 monit

# View logs
pm2 logs sports-bot --lines 100

# Restart bot
pm2 restart sports-bot

# Stop bot
pm2 stop sports-bot
```

### Step 5: Setup Firewall

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if using web interface)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### Step 6: Setup Fail2ban (Optional)

```bash
# Install fail2ban
sudo apt install fail2ban -y

# Start service
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Deploy with PM2

### PM2 Configuration File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'sports-bot',
    script: './src/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

Start with config:

```bash
pm2 start ecosystem.config.js
```

---

## Deploy with Docker

### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  bot:
    build: .
    restart: always
    env_file:
      - .env
    depends_on:
      - mysql
    volumes:
      - ./logs:/app/logs

  mysql:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: sports_venue_booking
      MYSQL_USER: botuser
      MYSQL_PASSWORD: bot_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./src/database/migrations/setup.sql:/docker-entrypoint-initdb.d/setup.sql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

### Deploy with Docker Compose

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f bot

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## Security Hardening

### 1. Environment Variables

```bash
# Never commit .env
echo ".env" >> .gitignore

# Set proper permissions
chmod 600 .env
```

### 2. Database Security

```sql
-- Use strong password
ALTER USER 'botuser'@'localhost' IDENTIFIED BY 'Very$trong#P@ssw0rd!';

-- Limit privileges
REVOKE ALL PRIVILEGES ON *.* FROM 'botuser'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON sports_venue_booking.* TO 'botuser'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Server Security

```bash
# Disable root login via SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd

# Keep system updated
sudo apt update && sudo apt upgrade -y

# Install unattended-upgrades
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 4. Rate Limiting

Add to bot code:

```javascript
// In src/bot/telegramBot.js
const rateLimit = require('telegraf-ratelimit');

// Apply rate limiting
const limitConfig = {
  window: 3000,
  limit: 3,
  onLimitExceeded: (ctx) => ctx.reply('Too many requests. Please slow down.')
};

bot.use(rateLimit(limitConfig));
```

---

## Monitoring & Logging

### 1. PM2 Monitoring

```bash
# Install PM2 Plus for advanced monitoring
pm2 link your_pm2_secret your_pm2_public

# View on: https://app.pm2.io/
```

### 2. Application Logging

Logs are saved to console by default. Setup file logging:

```javascript
// In src/utils/logger.js
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `bot-${moment().format('YYYY-MM-DD')}.log`);
```

### 3. Database Monitoring

```sql
-- Check slow queries
SHOW VARIABLES LIKE 'slow_query_log';
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- View process list
SHOW FULL PROCESSLIST;

-- Check table sizes
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'sports_venue_booking';
```

### 4. Uptime Monitoring

Use services like:
- **UptimeRobot** (Free)
- **Pingdom** (Paid)
- **StatusCake** (Free tier available)

---

## Backup Strategy

### 1. Database Backup

Create backup script `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/botuser/backups"
DB_NAME="sports_venue_booking"
DB_USER="botuser"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Delete backups older than 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

Setup cron job:

```bash
# Make script executable
chmod +x backup.sh

# Add to crontab
crontab -e

# Add line (daily at 2 AM):
0 2 * * * /home/botuser/sports-venue-booking-bot/backup.sh
```

### 2. Application Backup

```bash
# Backup application files
tar -czf app_backup_$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='logs' \
  /home/botuser/sports-venue-booking-bot

# Upload to cloud storage (optional)
# rclone copy app_backup_*.tar.gz remote:backups/
```

### 3. Automated Cloud Backup

Setup with rclone (to Google Drive, Dropbox, etc.):

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure remote
rclone config

# Add to backup script:
rclone copy $BACKUP_DIR remote:sports-bot-backups/
```

---

## Troubleshooting Production Issues

### Bot Not Responding

```bash
# Check if bot is running
pm2 status

# View logs
pm2 logs sports-bot --lines 50

# Restart bot
pm2 restart sports-bot

# Check system resources
free -h
df -h
```

### Database Connection Issues

```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u botuser -p sports_venue_booking

# Check MySQL errors
sudo tail -f /var/log/mysql/error.log
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# If bot uses too much memory, increase swap:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Gemini API Issues

```bash
# Check if API key is set
grep GEMINI_API_KEY .env

# Test API key manually
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
  "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=YOUR_API_KEY"

# Check bot logs for Gemini errors
pm2 logs sports-bot | grep -i gemini
```

---

## Scaling Considerations

### When to Scale

- More than 1000 active users
- Response time > 3 seconds
- CPU usage constantly > 80%
- Memory usage constantly > 80%

### Scaling Options

1. **Vertical Scaling**: Upgrade VPS specs
2. **Horizontal Scaling**: Multiple bot instances with load balancer
3. **Database Scaling**: Separate database server
4. **Caching**: Add Redis for caching

---

## Production Checklist

- [ ] Bot deployed and running on VPS
- [ ] PM2 configured for auto-restart
- [ ] Database backups automated
- [ ] Firewall configured
- [ ] SSL certificate installed (if using webhooks)
- [ ] Monitoring setup (PM2 Plus or similar)
- [ ] Logs rotation configured
- [ ] Environment variables secured
- [ ] Error notifications setup
- [ ] Documentation updated
- [ ] Bot tested in production

---

## 🎉 Done!

Your Sports Venue Booking Bot is now running in production!

For support or questions, please open an issue on GitHub.

---

**Previous**: [DATABASE.md](DATABASE.md) - Database documentation
**Home**: [README.md](../README.md) - Main documentation
