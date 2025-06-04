const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const MCPService = require('../services/mcp_service');

// Initialize MCP service
const mcpService = new MCPService();

// @desc    Generate resume suggestions
// @route   POST /api/mcp/resume
// @access  Private
router.post('/resume', protect, async (req, res) => {
    try {
        const { jobDescription } = req.body;
        const userProfile = req.user; // Assuming user profile is attached to request

        const suggestions = await mcpService.generateResumeSuggestions(userProfile, jobDescription);
        res.json({ suggestions });
    } catch (error) {
        console.error('Error generating resume suggestions:', error);
        res.status(500).json({ error: error.message || 'Error generating resume suggestions' });
    }
});

// @desc    Start mock interview
// @route   POST /api/mcp/interview
// @access  Private
router.post('/interview', protect, async (req, res) => {
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
// @access  Private
router.post('/evaluate', protect, async (req, res) => {
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
// @access  Private
router.post('/progress', protect, async (req, res) => {
    try {
        const session = req.body;
        const userId = req.user.id;

        const progress = await mcpService.trackProgress(userId, session);
        res.json({ progress });
    } catch (error) {
        console.error('Error tracking progress:', error);
        res.status(500).json({ error: error.message || 'Error tracking progress' });
    }
});

// @desc    Get progress report
// @route   GET /api/mcp/progress
// @access  Private
router.get('/progress', protect, async (req, res) => {
    try {
        const userId = req.user.id;

        const report = await mcpService.getProgressReport(userId);
        res.json({ report });
    } catch (error) {
        console.error('Error getting progress report:', error);
        res.status(500).json({ error: error.message || 'Error getting progress report' });
    }
});

module.exports = router; 