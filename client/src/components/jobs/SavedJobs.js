import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    Grid,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Work as WorkIcon,
    LocationOn as LocationIcon,
    Business as BusinessIcon,
    AccessTime as TimeIcon,
    AttachMoney as MoneyIcon,
    Delete as DeleteIcon,
    Bookmark as BookmarkIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const SavedJobs = () => {
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

    useEffect(() => {
        fetchSavedJobs();
    }, []);

    const fetchSavedJobs = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/jobs/saved`);
            setSavedJobs(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch saved jobs');
            console.error('Error fetching saved jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJob = async (jobId) => {
        try {
            await axios.delete(`${API_URL}/jobs/saved/${jobId}`);
            setSavedJobs(savedJobs.filter(job => job.id !== jobId));
        } catch (err) {
            console.error('Error deleting job:', err);
        }
    };

    const handleViewAnalysis = (job) => {
        setSelectedJob(job);
        setShowAnalysis(true);
    };

    const renderJobCard = (job) => {
        return (
            <Card key={job.id} sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {job.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                            icon={<BusinessIcon />}
                            label={job.company}
                            variant="outlined"
                        />
                        <Chip
                            icon={<LocationIcon />}
                            label={job.location}
                            variant="outlined"
                        />
                        {job.salary && (
                            <Chip
                                icon={<MoneyIcon />}
                                label={job.salary}
                                variant="outlined"
                            />
                        )}
                        {job.jobType && (
                            <Chip
                                icon={<WorkIcon />}
                                label={job.jobType}
                                variant="outlined"
                            />
                        )}
                    </Box>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            maxHeight: '100px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            mb: 2
                        }}
                    >
                        {job.description || 'No description available'}
                    </Typography>
                </CardContent>
                <CardActions>
                    {job.url && (
                        <Button
                            size="small"
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<WorkIcon />}
                        >
                            View Job
                        </Button>
                    )}
                    {job.insights && (
                        <Button
                            size="small"
                            onClick={() => handleViewAnalysis(job)}
                            startIcon={<AssessmentIcon />}
                        >
                            View Analysis
                        </Button>
                    )}
                    <Tooltip title="Remove from saved jobs">
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteJob(job.id)}
                            color="error"
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </CardActions>
            </Card>
        );
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Saved Jobs
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    View and manage your saved job listings
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {savedJobs.length === 0 ? (
                    <Alert severity="info">
                        No saved jobs found. Save jobs from your search results to see them here.
                    </Alert>
                ) : (
                    <Grid container spacing={2}>
                        {savedJobs.map(job => (
                            <Grid item xs={12} key={job.id}>
                                {renderJobCard(job)}
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Paper>

            {/* Job Analysis Dialog */}
            {selectedJob && showAnalysis && (
                <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                    <Typography variant="h5" gutterBottom>
                        Job Analysis
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                        {selectedJob.title} at {selectedJob.company}
                    </Typography>
                    <Box sx={{ whiteSpace: 'pre-line' }}>
                        {selectedJob.insights}
                    </Box>
                    <Button
                        variant="contained"
                        onClick={() => setShowAnalysis(false)}
                        sx={{ mt: 2 }}
                    >
                        Close Analysis
                    </Button>
                </Paper>
            )}
        </Container>
    );
};

export default SavedJobs; 