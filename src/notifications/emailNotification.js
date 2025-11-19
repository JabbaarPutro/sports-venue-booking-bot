const nodemailer = require('nodemailer');
const Logger = require('../utils/logger');
const moment = require('moment');

class EmailNotification {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async sendBookingConfirmation(email, booking) {
        try {
            moment.locale('id');
            const date = moment(booking.booking_date).format('dddd, D MMMM YYYY');
            const time = moment(booking.booking_time, 'HH:mm').format('HH:mm');

            const mailOptions = {
                from: `"Sports Venue Booking Bot" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Konfirmasi Booking - ${booking.venue_name}`,
                html: `
                    <h2>Konfirmasi Booking Berhasil ✅</h2>
                    <p>Booking Anda telah berhasil dikonfirmasi dengan detail sebagai berikut:</p>
                    
                    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Booking ID</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${booking.id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Venue</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${booking.venue_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Olahraga</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${booking.sport_type}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tanggal</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Jam</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Alamat</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${booking.venue_address || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Telepon</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${booking.venue_phone || '-'}</td>
                        </tr>
                    </table>
                    
                    <p style="margin-top: 20px;">
                        <strong>Catatan:</strong> Silakan hubungi venue untuk informasi pembayaran dan konfirmasi ketersediaan.
                    </p>
                    
                    <p>Terima kasih telah menggunakan layanan kami!</p>
                    <p><em>Sports Venue Booking Bot</em></p>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            Logger.info(`Booking confirmation email sent: ${info.messageId}`);
            return true;
        } catch (error) {
            Logger.error('Error sending booking confirmation email:', error.message);
            return false;
        }
    }

    async sendReminder(email, booking, hoursBeore) {
        try {
            moment.locale('id');
            const date = moment(booking.booking_date).format('dddd, D MMMM YYYY');
            const time = moment(booking.booking_time, 'HH:mm').format('HH:mm');
            
            const reminderType = hoursBeore === 24 ? '1 Hari' : '3 Jam';

            const mailOptions = {
                from: `"Sports Venue Booking Bot" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Reminder: Booking ${reminderType} Lagi - ${booking.venue_name}`,
                html: `
                    <h2>⏰ Reminder Booking</h2>
                    <p>Hai! Ini adalah pengingat bahwa Anda memiliki booking <strong>${reminderType}</strong> lagi:</p>
                    
                    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Venue</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${booking.venue_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Olahraga</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${booking.sport_type}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tanggal</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Jam</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Alamat</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${booking.venue_address || '-'}</td>
                        </tr>
                    </table>
                    
                    <p style="margin-top: 20px;">Jangan lupa untuk datang tepat waktu! 🎯</p>
                    <p><em>Sports Venue Booking Bot</em></p>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            Logger.info(`Reminder email sent: ${info.messageId}`);
            return true;
        } catch (error) {
            Logger.error('Error sending reminder email:', error.message);
            return false;
        }
    }

    async testConnection() {
        try {
            await this.transporter.verify();
            Logger.info('Email service connection verified');
            return true;
        } catch (error) {
            Logger.error('Email service connection failed:', error.message);
            return false;
        }
    }
}

module.exports = EmailNotification;
