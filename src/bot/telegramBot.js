const { Telegraf } = require('telegraf');
const MessageHandler = require('./messageHandler');
const Logger = require('../utils/logger');

class TelegramBot {
    constructor() {
        this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        this.messageHandler = new MessageHandler(this.bot);
        this.setupHandlers();
    }

    setupHandlers() {
        // Command handlers
        this.bot.command('start', (ctx) => this.messageHandler.handleStart(ctx));
        this.bot.command('help', (ctx) => this.messageHandler.handleHelp(ctx));
        this.bot.command('mybookings', (ctx) => this.messageHandler.handleMyBookings(ctx));
        
        this.bot.command('cancel', async (ctx) => {
            this.messageHandler.conversationStates.delete(ctx.from.id);
            await ctx.reply('❌ Pencarian dibatalkan.', {
                reply_markup: { remove_keyboard: true }
            });
        });

        // Message handler
        this.bot.on('text', async (ctx) => {
            try {
                await this.messageHandler.handleMessage(ctx);
            } catch (error) {
                Logger.error('Error handling message:', error);
                await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.');
            }
        });

        // Callback query handlers
        this.bot.action(/select_venue_(.+)/, async (ctx) => {
            const placeId = ctx.match[1];
            await this.messageHandler.handleVenueSelection(ctx, placeId);
        });

        this.bot.action(/confirm_(.+)/, async (ctx) => {
            const bookingData = ctx.match[1];
            await this.messageHandler.handleBookingConfirmation(ctx, bookingData);
        });

        this.bot.action(/cancel_(.+)/, async (ctx) => {
            await ctx.answerCbQuery('Booking dibatalkan');
            await ctx.reply('❌ Booking dibatalkan. Silakan cari venue lain.');
            this.messageHandler.conversationStates.delete(ctx.from.id);
        });

        this.bot.action('search_again', async (ctx) => {
            await ctx.answerCbQuery('Silakan kirim permintaan baru');
            await ctx.reply('🔍 Silakan kirim permintaan pencarian baru.');
            this.messageHandler.conversationStates.delete(ctx.from.id);
        });

        // Error handler
        this.bot.catch((error, ctx) => {
            Logger.error('Bot error:', error);
            ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi atau hubungi admin.');
        });
    }

    async start() {
        try {
            await this.bot.launch();
            Logger.info('✅ Telegram bot started successfully');
            Logger.info(`Bot username: @${this.bot.botInfo.username}`);
            
            // Enable graceful stop
            process.once('SIGINT', () => this.stop('SIGINT'));
            process.once('SIGTERM', () => this.stop('SIGTERM'));
        } catch (error) {
            Logger.error('Failed to start bot:', error);
            throw error;
        }
    }

    async stop(signal) {
        Logger.info(`${signal} received, stopping bot...`);
        await this.bot.stop(signal);
        process.exit(0);
    }

    getBot() {
        return this.bot;
    }
}

module.exports = TelegramBot;
