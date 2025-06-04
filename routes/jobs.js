const express = require('express');
const router = express.Router();
const { Pinecone } = require('@pinecone-database/pinecone');
const auth = require('../middleware/auth');
const { OpenAI } = require('openai');
const { scrapeJobs } = require('../services/job_scraper_service');
const PineconeService = require('../services/pinecone_service');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize Pinecone client
let pinecone;
let index;

const initializePinecone = async () => {
    try {
        if (!process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
            throw new Error('Missing Pinecone environment variables');
        }

        pinecone = new Pinecone({ 
            apiKey: process.env.PINECONE_API_KEY
        });
        index = pinecone.index(process.env.PINECONE_INDEX);
        console.log('Pinecone initialized successfully');
    } catch (error) {
        console.error('Error initializing Pinecone:', error);
        throw error;
    }
};

// Initialize Pinecone when the server starts
initializePinecone().catch(console.error);

// Get embedding from OpenAI
const getEmbedding = async (text) => {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: text
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error getting embedding:', error);
        throw error;
    }
};

// Generate combined insights for multiple jobs
const generateCombinedInsights = async (jobs) => {
    try {
        const prompt = `As a job market analyst, analyze these job listings and provide comprehensive combined insights:

        Jobs to Analyze:
        ${jobs.map(job => `
        Title: ${job.title}
        Company: ${job.company}
        Location: ${job.location}
        Salary: ${job.salary}
        Job Type: ${job.jobType}
        Description: ${job.description}
        `).join('\n')}

        Please provide a detailed analysis in the following format:

        1. Market Overview
        - Current demand trends for these roles
        - Salary ranges and compensation patterns
        - Common job types and work arrangements
        - Industry distribution

        2. Required Skills Analysis
        - Most common technical skills
        - Required experience levels
        - Emerging technologies
        - Soft skills and qualifications

        3. Company Insights
        - Industry distribution
        - Company size patterns
        - Work culture indicators
        - Growth opportunities

        4. Career Opportunities
        - Growth potential
        - Career paths
        - Required qualifications
        - Professional development

        5. Market Trends
        - Industry trends
        - Demand for these roles
        - Competitive position
        - Future outlook

        Format each section with clear bullet points and specific details.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a job market analyst with expertise in technology roles. Provide detailed, actionable insights about job listings. Focus on technical skills, market trends, and career opportunities."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error generating combined insights:', error);
        throw error;
    }
};

// Store combined insights in Pinecone
const storeCombinedInsights = async (jobs, insights) => {
    try {
        if (!pinecone || !index) {
            await initializePinecone();
        }

        // Generate embedding for the insights
        const embedding = await getEmbedding(insights);
        
        // Create a unique ID for the insights
        const insightId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Convert jobs array to a string representation
        const jobsString = jobs.map(job => 
            `${job.title}|${job.company}|${job.location}|${job.jobType}|${job.salary}`
        ).join(';');

        // Store in Pinecone using the correct format
        await index.upsert([
            {
                id: insightId,
                values: embedding,
                metadata: {
                    type: 'combined_job_insight',
                    jobs_data: jobsString, // Store as a single string
                    insights: insights,
                    timestamp: new Date().toISOString(),
                    keywords: jobs[0].keywords,
                    location: jobs[0].location,
                    job_count: jobs.length.toString() // Store count as string
                }
            }
        ]);

        console.log('Combined insights stored successfully in Pinecone');
        return insightId;
    } catch (error) {
        console.error('Error storing combined insights:', error);
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

        // Generate combined insights for all jobs
        console.log('Generating combined insights...');
        const combinedInsights = await generateCombinedInsights(jobs);
        console.log('Combined insights generated successfully');

        // Store the combined insights
        console.log('Storing combined insights...');
        const insightId = await storeCombinedInsights(jobs, combinedInsights);
        console.log('Combined insights stored successfully');

        res.json({ 
            jobs: jobs,
            insightId: insightId,
            insights: combinedInsights
        });
    } catch (err) {
        console.error('Error in job search:', err);
        res.status(500).json({ 
            message: 'Failed to process jobs',
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