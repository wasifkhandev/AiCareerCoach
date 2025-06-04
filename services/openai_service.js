const { OpenAI } = require('openai');
require('dotenv').config();

class OpenAIService {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is required');
        }

        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async getEmbedding(text) {
        try {
            if (!text) {
                throw new Error('Text is required for embedding');
            }

            const response = await this.openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: text
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error('Error getting embedding:', error);
            throw error;
        }
    }

    async generateCompletion(prompt, options = {}) {
        try {
            if (!prompt) {
                throw new Error('Prompt is required');
            }

            const response = await this.openai.chat.completions.create({
                model: options.model || "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 1000
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error generating completion:', error);
            throw error;
        }
    }
}

module.exports = OpenAIService; 