require('dotenv').config();
const TelegramBot = require('./bot/telegramBot');
const { testConnection } = require('./database/connection');
const Logger = require('./utils/logger');
const cron = require('node-cron');
const Booking = require('./database/models/Booking');
const User = require('./database/models/User');
const EmailNotification = require('./notifications/emailNotification');
const TelegramNotification = require('./notifications/telegramNotification');

class App {
    constructor() {
        this.bot = null;
        this.emailNotif = new EmailNotification();
    }

    async init() {
        Logger.info('🚀 Starting Sports Venue Booking Bot...');

        // Check environment variables
        this.checkEnvironment();

        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            Logger.error('Database connection failed. Please check your configuration.');
            process.exit(1);
        }

        // Initialize Telegram bot
        this.bot = new TelegramBot();
        await this.bot.start();

        // Setup reminder cron jobs
        this.setupReminderJobs();

        Logger.info('✅ Application started successfully');
    }

    checkEnvironment() {
        const requiredEnvVars = [
            'TELEGRAM_BOT_TOKEN',
            'GOOGLE_PLACES_API_KEY',
            'DB_HOST',
            'DB_NAME'
        ];

        const missing = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            Logger.error(`Missing required environment variables: ${missing.join(', ')}`);
            Logger.error('Please check your .env file');
            process.exit(1);
        }

        Logger.info('✅ Environment variables validated');
    }

    setupReminderJobs() {
        Logger.info('Setting up reminder jobs...');

        // 24-hour reminder - runs every hour
        cron.schedule('0 * * * *', async () => {
            await this.sendReminders(24);
        });

        // 3-hour reminder - runs every 30 minutes
        cron.schedule('*/30 * * * *', async () => {
            await this.sendReminders(3);
        });

        Logger.info('✅ Reminder jobs scheduled');
    }

    async sendReminders(hoursBefore) {
        try {
            Logger.info(`Checking for ${hoursBefore}h reminders...`);

            const bookings = await Booking.getUpcomingBookingsForReminder(hoursBefore);
            
            if (bookings.length === 0) {
                Logger.debug(`No bookings need ${hoursBefore}h reminder`);
                return;
            }

            Logger.info(`Sending ${hoursBefore}h reminders to ${bookings.length} bookings`);

            for (const booking of bookings) {
                try {
                    // Send Telegram notification
                    const telegramNotif = new TelegramNotification(this.bot.getBot());
                    await telegramNotif.sendReminder(booking.telegram_id, booking, hoursBefore);

                    // Send Email notification if available
                    if (booking.email) {
                        await this.emailNotif.sendReminder(booking.email, booking, hoursBefore);
                    }

                    // Mark reminder as sent
                    const reminderType = hoursBefore === 24 ? '24h' : '3h';
                    await Booking.setReminderSent(booking.id, reminderType);

                    Logger.info(`✅ ${hoursBefore}h reminder sent for booking ${booking.id}`);
                } catch (error) {
                    Logger.error(`Failed to send reminder for booking ${booking.id}:`, error.message);
                }
            }
        } catch (error) {
            Logger.error('Error in reminder job:', error.message);
        }
    }
}

// Start application
const app = new App();
app.init().catch(error => {
    Logger.error('Failed to start application:', error);
    process.exit(1);
});
