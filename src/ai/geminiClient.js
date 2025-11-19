const { GoogleGenerativeAI } = require('@google/generative-ai');
const Logger = require('../utils/logger');

class GeminiClient {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY tidak ditemukan di environment variables');
        }
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    async generateResponse(prompt) {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            Logger.error('Gemini API Error:', error.message);
            throw error;
        }
    }

    async extractIntent(userMessage) {
        const prompt = `
Analisis pesan user berikut dan extract informasi booking venue olahraga:

Pesan: "${userMessage}"

Extract dalam format JSON:
{
  "sport": "jenis olahraga (futsal/badminton/tennis/basketball/volleyball/padel/mini soccer)",
  "location": "lokasi yang diminta",
  "date": "tanggal dalam format YYYY-MM-DD",
  "time": "waktu dalam format HH:MM",
  "confidence": "0-100"
}

Jika informasi tidak lengkap, isi dengan null.
Response HANYA JSON, tanpa penjelasan tambahan.
`;

        try {
            const response = await this.generateResponse(prompt);
            // Parse JSON dari response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Tidak dapat parse intent dari response AI');
        } catch (error) {
            Logger.error('Error extracting intent:', error.message);
            return {
                sport: null,
                location: null,
                date: null,
                time: null,
                confidence: 0
            };
        }
    }

    async extractJSON(prompt) {
        try {
            const response = await this.generateResponse(prompt);
            
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return JSON.parse(response);
        } catch (error) {
            Logger.error('JSON extraction error:', error.message);
            return null;
        }
    }

    async isAvailable() {
        try {
            // Simple test to check if API key works
            await this.generateResponse('test');
            return true;
        } catch (error) {
            Logger.warn('Gemini API not available:', error.message);
            return false;
        }
    }
}

module.exports = GeminiClient;
