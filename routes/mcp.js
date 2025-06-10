const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const MCPService = require('../services/mcp_service');
const { OpenAI } = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');
const JobScraper = require('../services/job_scraper_service');
const { generateInsights } = require('../services/openai_service');
const { storeInsights, getSimilarJobs } = require('../services/pinecone_service');
const PineconeService = require('../services/pinecone_service');

// Initialize MCP service
const mcpService = new MCPService();

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize Pinecone
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

// Initialize PineconeService
const pineconeService = new PineconeService();

// @desc    Generate resume suggestions
// @route   POST /api/mcp/resume
// @access  Public
router.post('/resume', async (req, res) => {
    try {
        const { jobDescription } = req.body;
        const userProfile = req.user;

        const suggestions = await mcpService.generateResumeSuggestions(userProfile, jobDescription);
        res.json({ suggestions });
    } catch (error) {
        console.error('Error generating resume suggestions:', error);
        res.status(500).json({ error: error.message || 'Error generating resume suggestions' });
    }
});

// @desc    Start mock interview
// @route   POST /api/mcp/interview
// @access  Public
router.post('/interview', async (req, res) => {
    try {
        const { jobDescription } = req.body;
        const userProfile = req.user;

        const interview = await mcpService.conductMockInterview(jobDescription, userProfile);
        res.json({ interview });
    } catch (error) {
        console.error('Error starting mock interview:', error);
        res.status(500).json({ error: error.message || 'Error starting mock interview' });
    }
});

// @desc    Evaluate interview response
// @route   POST /api/mcp/evaluate
// @access  Public
router.post('/evaluate', async (req, res) => {
    try {
        const { question, response, jobDescription } = req.body;

        const evaluation = await mcpService.evaluateInterviewResponse(question, response, jobDescription);
        res.json({ evaluation });
    } catch (error) {
        console.error('Error evaluating interview response:', error);
        res.status(500).json({ error: error.message || 'Error evaluating interview response' });
    }
});

// @desc    Track progress
// @route   POST /api/mcp/progress
// @access  Public
router.post('/progress', async (req, res) => {
    try {
        const session = req.body;
        const userId = req.body.userId;

        const progress = await mcpService.trackProgress(userId, session);
        res.json({ progress });
    } catch (error) {
        console.error('Error tracking progress:', error);
        res.status(500).json({ error: error.message || 'Error tracking progress' });
    }
});

// @desc    Get progress report
// @route   GET /api/mcp/progress
// @access  Public
router.get('/progress', async (req, res) => {
    try {
        const userId = req.user.id;

        const report = await mcpService.getProgressReport(userId);
        res.json({ report });
    } catch (error) {
        console.error('Error getting progress report:', error);
        res.status(500).json({ error: error.message || 'Error getting progress report' });
    }
});

// Get career path analysis
// @access  Public
router.post('/analyze', async (req, res) => {
    try {
        const { skills, experience, goals } = req.body;
        // Use PineconeService to get similar job insights
        const jobInsights = await pineconeService.querySimilarInsights(skills.join(' '), { type: 'job_insight' });
        // Generate career path using OpenAI
        const careerPath = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a career development expert. Analyze the user's skills, experience, and goals to create a detailed career path."
                },
                {
                    role: "user",
                    content: `Create a detailed career path based on:\nSkills: ${skills.join(', ')}\nExperience: ${experience}\nGoals: ${goals}\nCurrent Job Market Insights: ${JSON.stringify(jobInsights)}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });
        res.json({
            careerPath: careerPath.choices[0].message.content,
            jobInsights
        });
    } catch (error) {
        console.error('Error in career path analysis:', error);
        res.status(500).json({ error: 'Failed to generate career path' });
    }
});

// Get skill analysis
// @access  Public
router.post('/skills', async (req, res) => {
    try {
        const { currentSkills, targetRole } = req.body;
        // Use PineconeService to get relevant job insights
        const jobInsights = await pineconeService.querySimilarInsights(currentSkills.join(' '), { type: 'job_insight' });
        // Generate skill gap analysis
        const skillAnalysis = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a skills analysis expert. Analyze the user's current skills and identify gaps for their target role."
                },
                {
                    role: "user",
                    content: `Analyze skills for:\nCurrent Skills: ${currentSkills.join(', ')}\nTarget Role: ${targetRole}\nJob Market Insights: ${JSON.stringify(jobInsights)}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });
        res.json({
            skillAnalysis: skillAnalysis.choices[0].message.content,
            jobInsights
        });
    } catch (error) {
        console.error('Error in skill analysis:', error);
        res.status(500).json({ error: 'Failed to analyze skills' });
    }
});

// Get learning path
// @access  Public
router.post('/learning-path', async (req, res) => {
    try {
        const { skills, careerPath } = req.body;
        
        // Generate learning path
        const learningPath = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a learning path expert. Create a detailed learning path to help users achieve their career goals."
                },
                {
                    role: "user",
                    content: `Create a learning path for:
                    Skills to Develop: ${skills.join(', ')}
                    Career Path: ${careerPath}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        res.json({
            learningPath: learningPath.choices[0].message.content
        });
    } catch (error) {
        console.error('Error in learning path generation:', error);
        res.status(500).json({ error: 'Failed to generate learning path' });
    }
});

module.exports = router; 