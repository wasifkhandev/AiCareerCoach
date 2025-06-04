const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAI } = require('openai');
require('dotenv').config();

class PineconeService {
    constructor() {
        // Validate environment variables
        const requiredEnvVars = {
            PINECONE_API_KEY: process.env.PINECONE_API_KEY,
            PINECONE_INDEX: process.env.PINECONE_INDEX,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY
        };

        const missingVars = Object.entries(requiredEnvVars)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        this.pinecone = new Pinecone({ 
            apiKey: process.env.PINECONE_API_KEY
        });
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.initialized = false;
        this.dimensions = 1536; // OpenAI's text-embedding-ada-002 model dimension
    }

    async initialize() {
        if (!this.initialized) {
            try {
                this.pineconeIndex = this.pinecone.index(process.env.PINECONE_INDEX);
                
                // Verify index dimensions
                const stats = await this.pineconeIndex.describeIndexStats();
                if (stats.dimension !== this.dimensions) {
                    throw new Error(`Index dimension mismatch. Expected ${this.dimensions}, got ${stats.dimension}`);
                }
                
                this.initialized = true;
                console.log('Pinecone initialized successfully');
            } catch (error) {
                console.error('Pinecone initialization failed:', error);
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
            
            if (!embedding || embedding.length !== this.dimensions) {
                throw new Error(`Invalid embedding returned. Expected ${this.dimensions}, got ${embedding?.length || 0}`);
            }

            return embedding;
        } catch (error) {
            console.error('Error getting embedding:', error);
            throw error;
        }
    }

    async storeInsight(insight) {
        try {
            await this.initialize();

            if (!insight?.content) {
                throw new Error('Insight content is required');
            }

            const insightId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('Generated insight ID:', insightId);
            
            // Generate embedding
            const embedding = await this.getEmbedding(insight.content);
            console.log('Generated embedding with length:', embedding.length);
            
            // Preserve all fields from the insight object
            const metadata = {
                ...insight,
                id: insightId,
                timestamp: new Date().toISOString()
            };
            console.log('Storing metadata:', JSON.stringify(metadata, null, 2));

            // Store in Pinecone using the correct format
            const upsertResult = await this.pineconeIndex.upsert([
                {
                    id: insightId,
                    values: embedding,
                    metadata
                }
            ]);
            console.log('Upsert result:', JSON.stringify(upsertResult, null, 2));

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

            await this.pineconeIndex.deleteMany([insightId]);
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

            console.log('Fetching insight with ID:', insightId);
            const result = await this.pineconeIndex.fetch([insightId]);
            console.log('Fetch result:', JSON.stringify(result, null, 2));

            if (!result.records || !result.records[insightId]) {
                console.log('No record found for ID:', insightId);
                return null;
            }

            const metadata = result.records[insightId].metadata;
            console.log('Retrieved metadata:', JSON.stringify(metadata, null, 2));
            return metadata;
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

    async upsert(document) {
        try {
            await this.initialize();
            
            if (!document.id || !document.values || !document.metadata) {
                throw new Error('Invalid document format. Required: id, values, and metadata');
            }

            if (document.values.length !== this.dimensions) {
                throw new Error(`Invalid vector dimensions. Expected ${this.dimensions}, got ${document.values.length}`);
            }

            // Use the correct upsert format
            await this.pineconeIndex.upsert([
                {
                    id: document.id,
                    values: document.values,
                    metadata: document.metadata
                }
            ]);

            return document.id;
        } catch (error) {
            console.error('Error upserting document:', error);
            throw error;
        }
    }
}

module.exports = PineconeService;
