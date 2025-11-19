const chrono = require('chrono-node');
const moment = require('moment');

class DateParser {
    static parse(text) {
        // Parse date using chrono-node
        const parsed = chrono.parse(text, new Date(), { forwardDate: true });
        
        if (parsed.length === 0) {
            return null;
        }

        const result = parsed[0];
        const date = result.start.date();
        
        return {
            date: moment(date).format('YYYY-MM-DD'),
            time: result.start.get('hour') !== null ? 
                moment(date).format('HH:mm') : null,
            original: result.text
        };
    }

    static parseDate(text) {
        const result = this.parse(text);
        return result ? result.date : null;
    }

    static parseTime(text) {
        // Extract time patterns like "18:00", "6 pm", "jam 18"
        const timePatterns = [
            /(\d{1,2}):(\d{2})/,  // 18:00
            /jam\s+(\d{1,2})/i,    // jam 18
            /pukul\s+(\d{1,2})/i,  // pukul 18
            /(\d{1,2})\s*(pm|am)/i // 6 pm
        ];

        for (const pattern of timePatterns) {
            const match = text.match(pattern);
            if (match) {
                let hour = parseInt(match[1]);
                const minute = match[2] ? parseInt(match[2]) : 0;
                
                // Handle AM/PM
                if (match[3] && match[3].toLowerCase() === 'pm' && hour < 12) {
                    hour += 12;
                }
                if (match[3] && match[3].toLowerCase() === 'am' && hour === 12) {
                    hour = 0;
                }

                return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            }
        }

        // Try chrono-node as fallback
        const result = this.parse(text);
        return result ? result.time : null;
    }

    static parseDateAndTime(text) {
        const dateResult = this.parse(text);
        if (!dateResult) {
            return { date: null, time: null };
        }

        return {
            date: dateResult.date,
            time: dateResult.time || this.parseTime(text)
        };
    }

    static isDateValid(dateString) {
        const date = moment(dateString, 'YYYY-MM-DD', true);
        return date.isValid() && date.isSameOrAfter(moment(), 'day');
    }

    static isTimeValid(timeString) {
        const time = moment(timeString, 'HH:mm', true);
        return time.isValid();
    }

    static formatDateIndonesian(dateString) {
        moment.locale('id');
        return moment(dateString).format('dddd, D MMMM YYYY');
    }

    static formatTimeIndonesian(timeString) {
        return moment(timeString, 'HH:mm').format('HH:mm');
    }
}

module.exports = DateParser;
