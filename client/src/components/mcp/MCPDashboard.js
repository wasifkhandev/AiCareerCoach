import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Stack
} from '@mui/material';
import {
    Description as DescriptionIcon,
    Work as WorkIcon,
    Assessment as AssessmentIcon,
    TrendingUp as TrendingUpIcon,
    Star as StarIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';

const MCPDashboard = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resumeSuggestions, setResumeSuggestions] = useState(null);
    const [mockInterview, setMockInterview] = useState(null);
    const [progressReport, setProgressReport] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleGenerateResumeSuggestions = async () => {
        if (!selectedJob) {
            setError('Please select a job first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/mcp/resume', {
                jobDescription: selectedJob.description
            });

            setResumeSuggestions(response.data.suggestions);
        } catch (err) {
            setError(err.response?.data?.error || 'Error generating resume suggestions');
        } finally {
            setLoading(false);
        }
    };

    const handleStartMockInterview = async () => {
        if (!selectedJob) {
            setError('Please select a job first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/mcp/interview', {
                jobDescription: selectedJob.description
            });

            setMockInterview(response.data.interview);
        } catch (err) {
            setError(err.response?.data?.error || 'Error starting mock interview');
        } finally {
            setLoading(false);
        }
    };

    const handleGetProgressReport = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get('/api/mcp/progress');
            setProgressReport(response.data.report);
        } catch (err) {
            setError(err.response?.data?.error || 'Error getting progress report');
        } finally {
            setLoading(false);
        }
    };

    const renderResumeSuggestions = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                Resume Suggestions
            </Typography>
            {resumeSuggestions ? (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                        {resumeSuggestions}
                    </Typography>
                </Paper>
            ) : (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerateResumeSuggestions}
                    disabled={loading || !selectedJob}
                    startIcon={<DescriptionIcon />}
                >
                    Generate Resume Suggestions
                </Button>
            )}
        </Box>
    );

    const renderMockInterview = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                Mock Interview
            </Typography>
            {mockInterview ? (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                        {mockInterview}
                    </Typography>
                </Paper>
            ) : (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleStartMockInterview}
                    disabled={loading || !selectedJob}
                    startIcon={<WorkIcon />}
                >
                    Start Mock Interview
                </Button>
            )}
        </Box>
    );

    const renderProgressReport = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                Progress Report
            </Typography>
            {progressReport ? (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                        {progressReport}
                    </Typography>
                </Paper>
            ) : (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGetProgressReport}
                    disabled={loading}
                    startIcon={<AssessmentIcon />}
                >
                    Get Progress Report
                </Button>
            )}
        </Box>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Career AI Coach
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Personalized career development and interview preparation
                </Typography>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab icon={<DescriptionIcon />} label="Resume Suggestions" />
                    <Tab icon={<WorkIcon />} label="Mock Interview" />
                    <Tab icon={<AssessmentIcon />} label="Progress Report" />
                </Tabs>
            </Paper>

            {loading ? (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box>
                    {activeTab === 0 && renderResumeSuggestions()}
                    {activeTab === 1 && renderMockInterview()}
                    {activeTab === 2 && renderProgressReport()}
                </Box>
            )}
        </Container>
    );
};

export default MCPDashboard; 