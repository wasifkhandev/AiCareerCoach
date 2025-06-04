const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAI } = require('openai');
require('dotenv').config();

class PineconeService {
    constructor() {
        if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX || !process.env.OPENAI_API_KEY) {
            throw new Error('Required environment variables are missing');
        }

        this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        this.initialized = false;
        this.sourceDimensions = 1536;
        this.targetDimensions = 1024; // Must match your Pinecone index
    }

    async initialize() {
        if (!this.initialized) {
            try {
                this.pineconeIndex = this.pinecone.index(process.env.PINECONE_INDEX);
                this.initialized = true;
            } catch (error) {
                console.error('Pinecone init failed:', error);
                throw error;
            }
        }
    }

    async getEmbedding(text) {
        if (!text || typeof text !== 'string' || !text.trim()) {
            throw new Error('Invalid text for embedding');
        }

        try {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: text,
            });

            const embedding = response.data[0]?.embedding;
            console.log('Original embedding dimensions:', embedding?.length);
            
            if (!embedding || embedding.length !== this.sourceDimensions) {
                throw new Error(`Invalid embedding returned. Expected ${this.sourceDimensions}, got ${embedding?.length || 0}`);
            }

            const reduced = this.reduceDimensions(embedding);
            console.log('Reduced embedding dimensions:', reduced?.length);
            
            if (!reduced || reduced.length !== this.targetDimensions) {
                throw new Error(`Reduced embedding has invalid dimensions. Expected ${this.targetDimensions}, got ${reduced?.length || 0}`);
            }

            return reduced;
        } catch (error) {
            console.error('Error getting embedding:', error);
            throw error;
        }
    }

    reduceDimensions(embedding) {
        if (!embedding || embedding.length !== this.sourceDimensions) {
            throw new Error(`Invalid input embedding dimensions. Expected ${this.sourceDimensions}, got ${embedding?.length || 0}`);
        }

        const reduced = new Array(this.targetDimensions).fill(0);
        const groupSize = Math.ceil(this.sourceDimensions / this.targetDimensions);

        for (let i = 0; i < this.targetDimensions; i++) {
            const start = i * groupSize;
            const end = Math.min(start + groupSize, this.sourceDimensions);
            const group = embedding.slice(start, end);
            reduced[i] = group.reduce((sum, val) => sum + val, 0) / group.length;
        }

        // Normalize
        const magnitude = Math.sqrt(reduced.reduce((sum, val) => sum + val * val, 0));
        const normalized = reduced.map(val => val / magnitude);

        if (normalized.length !== this.targetDimensions) {
            throw new Error(`Normalized embedding has invalid dimensions. Expected ${this.targetDimensions}, got ${normalized.length}`);
        }

        return normalized;
    }

    async storeInsight(insight) {
        try {
            await this.initialize();

            if (!insight?.content) {
                throw new Error('Insight content is required');
            }

            const insightId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Generate and validate embedding
            const embedding = await this.getEmbedding(insight.content);
            console.log('Generated embedding dimensions:', embedding.length);
            
            if (!embedding || embedding.length !== this.targetDimensions) {
                throw new Error(`Invalid embedding dimensions after reduction. Expected ${this.targetDimensions}, got ${embedding?.length || 0}`);
            }

            const metadata = {
                type: 'insight',
                title: insight.title || 'Untitled',
                content: insight.content,
                category: insight.category || 'general',
                timestamp: new Date().toISOString(),
                id: insightId
            };

            // Store in Pinecone with proper format
            await this.pineconeIndex.upsert({
                vectors: [{
                    id: insightId,
                    values: embedding,
                    metadata
                }]
            });

            return insightId;
        } catch (error) {
            console.error('Error storing insight:', error);
            throw error;
        }
    }

    async deleteInsight(insightId) {
        try {
            if (!insightId) throw new Error('Insight ID is required');
            await this.initialize();

            await this.pineconeIndex.delete({ ids: [insightId] });
            return true;
        } catch (error) {
            console.error('Error deleting insight:', error);
            throw error;
        }
    }

    async getInsight(insightId) {
        try {
            if (!insightId) throw new Error('Insight ID is required');
            await this.initialize();

            const result = await this.pineconeIndex.fetch({ ids: [insightId] });
            return result.vectors?.[insightId]?.metadata || null;
        } catch (error) {
            console.error('Error getting insight:', error);
            throw error;
        }
    }

    async querySimilarInsights(query, filters = {}) {
        try {
            await this.initialize();

            const queryEmbedding = await this.getEmbedding(query);
            const results = await this.pineconeIndex.query({
                vector: queryEmbedding,
                topK: 5,
                filter: filters,
                includeMetadata: true
            });

            return results.matches.map(match => ({
                ...match.metadata,
                score: match.score
            }));
        } catch (error) {
            console.error('Error querying insights:', error);
            throw error;
        }
    }
}

module.exports = PineconeService;
