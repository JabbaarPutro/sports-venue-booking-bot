const axios = require('axios');
const Logger = require('../utils/logger');

class OllamaClient {
    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'llama2';
    }

    async isAvailable() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            Logger.warn('OLLAMA not available:', error.message);
            return false;
        }
    }

    async generate(prompt, options = {}) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/generate`,
                {
                    model: this.model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: options.temperature || 0.7,
                        ...options
                    }
                },
                { timeout: 30000 }
            );

            return response.data.response;
        } catch (error) {
            Logger.error('OLLAMA generation error:', error.message);
            throw error;
        }
    }

    async chat(messages, options = {}) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat`,
                {
                    model: this.model,
                    messages: messages,
                    stream: false,
                    options: {
                        temperature: options.temperature || 0.7,
                        ...options
                    }
                },
                { timeout: 30000 }
            );

            return response.data.message.content;
        } catch (error) {
            Logger.error('OLLAMA chat error:', error.message);
            throw error;
        }
    }

    async extractJSON(prompt) {
        try {
            const response = await this.generate(prompt, { temperature: 0.3 });
            
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
}

module.exports = OllamaClient;
