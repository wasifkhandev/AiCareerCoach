const express = require('express');
const router = express.Router();
const { PineconeClient } = require('@pinecone-database/pinecone');
const auth = require('../middleware/auth');
const { getEmbedding } = require('../services/openai_service');
const { scrapeJobs } = require('../services/job_scraper_service');
const PineconeService = require('../services/pinecone_service');

// Initialize Pinecone client
let pinecone;
let index;

const initializePinecone = async () => {
    try {
        if (!process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
            throw new Error('Missing Pinecone environment variables');
        }

        pinecone = new PineconeClient();
        await pinecone.init({
            environment: process.env.PINECONE_ENVIRONMENT,
            apiKey: process.env.PINECONE_API_KEY
        });
        index = pinecone.Index(process.env.PINECONE_INDEX);
        console.log('Pinecone initialized successfully');
    } catch (error) {
        console.error('Error initializing Pinecone:', error);
        throw error;
    }
};

// Initialize Pinecone when the server starts
initializePinecone().catch(console.error);

// Store insights in Pinecone
const storeInsights = async (jobData, insights) => {
    try {
        if (!pinecone || !index) {
            await initializePinecone();
        }

        // Generate embedding for the insights
        const embedding = await getEmbedding(insights);
        
        // Create a unique ID for the insights
        const insightId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store in Pinecone
        await index.upsert({
            vectors: [{
                id: insightId,
                values: embedding,
                metadata: {
                    jobTitle: jobData.title,
                    company: jobData.company,
                    location: jobData.location,
                    jobType: jobData.jobType,
                    salary: jobData.salary,
                    description: jobData.description,
                    insights: insights,
                    timestamp: new Date().toISOString(),
                    type: 'job_insight'
                }
            }]
        });

        console.log('Insights stored successfully in Pinecone');
        return insightId;
    } catch (error) {
        console.error('Error storing insights:', error);
        throw error;
    }
};

// Search and scrape jobs
router.get('/search', async (req, res) => {
    try {
        const { keywords, location } = req.query;
        
        if (!keywords || !location) {
            return res.status(400).json({ 
                message: 'Keywords and location are required' 
            });
        }

        console.log('Scraping jobs for:', { keywords, location });
        const jobs = await scrapeJobs(keywords, location);
        console.log(`Found ${jobs.length} jobs`);

        // Store insights for each job in Pinecone
        const jobsWithInsights = await Promise.all(jobs.map(async (job) => {
            if (job.insights) {
                try {
                    const insightId = await storeInsights(job, job.insights);
                    return { ...job, insightId };
                } catch (error) {
                    console.error(`Error storing insights for job ${job.title}:`, error);
                    return job;
                }
            }
            return job;
        }));

        res.json({ jobs: jobsWithInsights });
    } catch (err) {
        console.error('Error scraping jobs:', err);
        res.status(500).json({ 
            message: 'Failed to scrape jobs',
            error: err.message 
        });
    }
});

// Save a job
router.post('/save', auth, async (req, res) => {
    try {
        console.log('Received save job request:', req.body);

        if (!req.body || !req.body.description) {
            return res.status(400).json({
                message: 'Job description is required'
            });
        }

        if (!pinecone || !index) {
            console.log('Reinitializing Pinecone...');
            await initializePinecone();
        }

        const jobData = {
            ...req.body,
            userId: req.user.id,
            savedAt: new Date().toISOString()
        };

        console.log('Generating embedding for job description...');
        const embedding = await getEmbedding(jobData.description);
        console.log('Embedding generated successfully');

        // Create a unique ID for the job
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('Storing job in Pinecone...');
        const upsertResponse = await index.upsert({
            vectors: [{
                id: jobId,
                values: embedding,
                metadata: {
                    ...jobData,
                    type: 'saved_job'
                }
            }]
        });
        console.log('Pinecone upsert response:', upsertResponse);

        res.json({ 
            ...jobData, 
            id: jobId,
            message: 'Job saved successfully'
        });
    } catch (err) {
        console.error('Error saving job:', err);
        res.status(500).json({ 
            message: 'Failed to save job',
            error: err.message,
            details: err.stack
        });
    }
});

// Get saved jobs
router.get('/saved', auth, async (req, res) => {
    try {
        if (!pinecone || !index) {
            await initializePinecone();
        }

        // Create a dummy vector of the correct dimension (1536 for OpenAI embeddings)
        const dummyVector = new Array(1536).fill(0);

        const queryResponse = await index.query({
            vector: dummyVector,
            filter: {
                $and: [
                    { userId: { $eq: req.user.id } },
                    { type: { $eq: 'saved_job' } }
                ]
            },
            topK: 100,
            includeMetadata: true
        });

        const jobs = queryResponse.matches.map(match => ({
            id: match.id,
            ...match.metadata
        }));

        res.json(jobs);
    } catch (err) {
        console.error('Error fetching saved jobs:', err);
        res.status(500).json({ 
            message: 'Failed to fetch saved jobs',
            error: err.message 
        });
    }
});

// Delete saved job
router.delete('/saved/:id', auth, async (req, res) => {
    try {
        if (!pinecone || !index) {
            await initializePinecone();
        }

        await index.delete1({
            ids: [req.params.id],
            filter: {
                $and: [
                    { userId: { $eq: req.user.id } },
                    { type: { $eq: 'saved_job' } }
                ]
            }
        });

        res.json({ message: 'Job removed from saved jobs' });
    } catch (err) {
        console.error('Error deleting saved job:', err);
        res.status(500).json({ 
            message: 'Failed to delete job',
            error: err.message 
        });
    }
});

// Get similar insights
router.get('/similar-insights', async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ 
                message: 'Query is required' 
            });
        }

        if (!pinecone || !index) {
            await initializePinecone();
        }

        // Generate embedding for the query
        const queryEmbedding = await getEmbedding(query);

        // Query Pinecone for similar insights
        const queryResponse = await index.query({
            vector: queryEmbedding,
            filter: {
                type: { $eq: 'job_insight' }
            },
            topK: 5,
            includeMetadata: true
        });

        const similarInsights = queryResponse.matches.map(match => ({
            id: match.id,
            score: match.score,
            ...match.metadata
        }));

        res.json({ similarInsights });
    } catch (err) {
        console.error('Error fetching similar insights:', err);
        res.status(500).json({ 
            message: 'Failed to fetch similar insights',
            error: err.message 
        });
    }
});

// Test endpoint to verify stored insights
router.get('/test-insights', async (req, res) => {
    try {
        if (!pinecone || !index) {
            await initializePinecone();
        }

        // Create a dummy vector of the correct dimension (1536 for OpenAI embeddings)
        const dummyVector = new Array(1536).fill(0);

        // Query Pinecone for all stored insights
        const queryResponse = await index.query({
            vector: dummyVector,
            filter: {
                type: { $eq: 'job_insight' }
            },
            topK: 10,
            includeMetadata: true
        });

        const insights = queryResponse.matches.map(match => ({
            id: match.id,
            score: match.score,
            metadata: match.metadata
        }));

        res.json({
            message: `Found ${insights.length} stored insights`,
            insights: insights
        });
    } catch (err) {
        console.error('Error fetching insights:', err);
        res.status(500).json({ 
            message: 'Failed to fetch insights',
            error: err.message 
        });
    }
});

// Test endpoint to verify Pinecone storage
router.get('/test-storage', async (req, res) => {
    try {
        const pineconeService = new PineconeService();
        
        // Test connection
        await pineconeService.initialize();
        
        // Get index stats
        const stats = await pineconeService.index.describeIndexStats();
        
        // Query recent jobs
        const dummyVector = new Array(1536).fill(0);
        const queryResponse = await pineconeService.index.query({
            vector: dummyVector,
            topK: 5,
            includeMetadata: true,
            filter: {
                type: { $eq: 'job_insight' }
            }
        });

        res.json({
            message: 'Pinecone connection successful',
            stats: stats,
            recentJobs: queryResponse.matches.map(match => ({
                id: match.id,
                score: match.score,
                metadata: match.metadata
            }))
        });
    } catch (err) {
        console.error('Error testing Pinecone storage:', err);
        res.status(500).json({ 
            message: 'Failed to test Pinecone storage',
            error: err.message 
        });
    }
});

module.exports = router; 