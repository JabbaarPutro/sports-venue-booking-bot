const GeminiClient = require('./geminiClient');
const DateParser = require('../utils/dateParser');
const Logger = require('../utils/logger');
const sportsConfig = require('../../config/sports.json');

class IntentExtractor {
    constructor() {
        try {
            this.gemini = new GeminiClient();
        } catch (error) {
            Logger.warn('Gemini client initialization failed:', error.message);
            Logger.info('Will use rule-based extraction as fallback');
            this.gemini = null;
        }
    }

    async extractIntent(message) {
        Logger.info('Extracting intent from message:', message);

        // Try Gemini first if available
        if (this.gemini) {
            const geminiAvailable = await this.gemini.isAvailable();
            
            if (geminiAvailable) {
                try {
                    return await this.extractWithGemini(message);
                } catch (error) {
                    Logger.warn('Gemini extraction failed, falling back to rule-based:', error.message);
                }
            }
        }

        // Fallback to rule-based extraction
        return this.extractWithRules(message);
    }

    async extractWithGemini(message) {
        const sportsNames = sportsConfig.sports.map(s => s.name).join(', ');
        
        const prompt = `
Extract booking information from this Indonesian text: "${message}"

Extract these fields and return as JSON:
- sport: type of sport (${sportsNames}) or null
- location: city or area name or null
- date: date in YYYY-MM-DD format or null
- time: time in HH:mm format or null

Examples:
"Cari lapangan futsal di Jakarta Selatan besok jam 18:00" -> {"sport":"Futsal","location":"Jakarta Selatan","date":"2025-11-20","time":"18:00"}
"Booking tennis court Bandung minggu depan" -> {"sport":"Tennis","location":"Bandung","date":"2025-11-26","time":null}

Return only valid JSON without explanation.
`;

        const result = await this.gemini.extractJSON(prompt);
        
        if (result) {
            return this.validateAndEnrichIntent(result);
        }

        return null;
    }

    extractWithRules(message) {
        const intent = {
            sport: null,
            location: null,
            date: null,
            time: null
        };

        const lowerMessage = message.toLowerCase();

        // Extract sport
        for (const sport of sportsConfig.sports) {
            for (const keyword of sport.keywords) {
                if (lowerMessage.includes(keyword.toLowerCase())) {
                    intent.sport = sport.name;
                    break;
                }
            }
            if (intent.sport) break;
        }

        // Extract location - common Indonesian cities and areas
        const locationPatterns = [
            /di\s+([A-Za-z\s]+?)(?:\s+besok|\s+minggu|\s+tanggal|\s+jam|$)/i,
            /lokasi\s+([A-Za-z\s]+?)(?:\s+besok|\s+minggu|\s+tanggal|\s+jam|$)/i,
            /area\s+([A-Za-z\s]+?)(?:\s+besok|\s+minggu|\s+tanggal|\s+jam|$)/i
        ];

        for (const pattern of locationPatterns) {
            const match = message.match(pattern);
            if (match) {
                intent.location = match[1].trim();
                break;
            }
        }

        // Extract date and time using DateParser
        const dateTimeResult = DateParser.parseDateAndTime(message);
        intent.date = dateTimeResult.date;
        intent.time = dateTimeResult.time;

        Logger.debug('Extracted intent (rule-based):', intent);
        return intent;
    }

    validateAndEnrichIntent(intent) {
        // Validate sport
        if (intent.sport) {
            const sportExists = sportsConfig.sports.find(
                s => s.name.toLowerCase() === intent.sport.toLowerCase()
            );
            if (!sportExists) {
                intent.sport = null;
            }
        }

        // Validate date
        if (intent.date && !DateParser.isDateValid(intent.date)) {
            intent.date = null;
        }

        // Validate time
        if (intent.time && !DateParser.isTimeValid(intent.time)) {
            intent.time = null;
        }

        return intent;
    }

    getMissingFields(intent) {
        const missing = [];
        
        if (!intent.sport) missing.push('jenis olahraga');
        if (!intent.location) missing.push('lokasi');
        if (!intent.date) missing.push('tanggal');
        if (!intent.time) missing.push('jam');

        return missing;
    }

    isIntentComplete(intent) {
        return intent.sport && intent.location && intent.date && intent.time;
    }
}

module.exports = IntentExtractor;
