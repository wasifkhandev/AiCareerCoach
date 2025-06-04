import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    LinearProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Collapse,
    Stack
} from '@mui/material';
import {
    Search as SearchIcon,
    Work as WorkIcon,
    LocationOn as LocationIcon,
    Business as BusinessIcon,
    AccessTime as TimeIcon,
    AttachMoney as MoneyIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    FilterList as FilterListIcon,
    Save as SaveIcon,
    Share as ShareIcon,
    Info as InfoIcon,
    School as SchoolIcon,
    Assignment as AssignmentIcon,
    Group as GroupIcon,
    Delete as DeleteIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const JobAnalysis = ({ analysis }) => {
    if (!analysis) return null;

    // Split analysis into sections
    const sections = analysis.split('\n\n').filter(section => section.trim());

    return (
        <Paper elevation={2} sx={{ p: 3, mt: 4, bgcolor: 'background.default' }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <AssignmentIcon color="primary" />
                Market Analysis
            </Typography>
            
            {sections.map((section, index) => {
                const [title, ...content] = section.split('\n');
                return (
                    <Box key={index} sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ 
                            color: 'primary.main',
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            {title}
                        </Typography>
                        <List dense>
                            {content.map((item, itemIndex) => {
                                const trimmedItem = item.trim();
                                if (trimmedItem.startsWith('-')) {
                                    return (
                                        <ListItem key={itemIndex}>
                                            <ListItemIcon>
                                                <ExpandMoreIcon />
                                            </ListItemIcon>
                                            <ListItemText primary={trimmedItem.substring(1).trim()} />
                                        </ListItem>
                                    );
                                }
                                return null;
                            })}
                        </List>
                    </Box>
                );
            })}
        </Paper>
    );
};

const JobScraper = () => {
    const { token } = useSelector((state) => state.auth);
    const [formData, setFormData] = useState({
        keywords: '',
        location: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showJobDetails, setShowJobDetails] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleScrape = async () => {
        const { keywords, location } = formData;
        
        if (!keywords || !location) {
            setError('Keywords and location are required');
            return;
        }

        setLoading(true);
        setError(null);
        setJobs([]);
        setAnalysis(null);
        
        try {
            const response = await axios.get(`${API_URL}/jobs/search`, {
                params: {
                    keywords: keywords,
                    location: location
                }
            });

            setJobs(response.data.jobs || []);
            setAnalysis(response.data.analysis);

            setSnackbar({
                open: true,
                message: `Successfully found ${response.data.jobs.length} jobs and stored insights`,
                severity: 'success'
            });
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error scraping jobs.';
            setError(errorMessage);
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleJobClick = (job) => {
        setSelectedJob(job);
        setShowJobDetails(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const renderJobCard = (job) => {
        return (
            <Card key={job.url} sx={{ mb: 2 }}>
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
                            startIcon={<SearchIcon />}
                        >
                            View Job
                        </Button>
                    )}
                    <Button
                        size="small"
                        onClick={() => handleJobClick(job)}
                        startIcon={<DescriptionIcon />}
                    >
                        View Details
                    </Button>
                </CardActions>
            </Card>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Job Search & Analysis
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Search and analyze job postings with AI-powered insights
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Keywords"
                            name="keywords"
                            value={formData.keywords}
                            onChange={handleChange}
                            placeholder="e.g., Software Engineer, React Developer"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g., New York, Remote"
                        />
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={handleScrape}
                        disabled={loading || !formData.keywords || !formData.location}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Search Jobs'}
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {jobs.length > 0 && (
                    <>
                        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                            Job Listings
                        </Typography>
                        {jobs.map((job) => renderJobCard(job))}
                        
                        {/* Display comprehensive analysis */}
                        {jobs[0]?.insights && (
                            <JobAnalysis analysis={jobs[0].insights} />
                        )}
                    </>
                )}

                {/* Job Details Dialog */}
                <Dialog
                    open={showJobDetails}
                    onClose={() => setShowJobDetails(false)}
                    maxWidth="md"
                    fullWidth
                >
                    {selectedJob && (
                        <>
                            <DialogTitle>
                                <Typography variant="h6">
                                    {selectedJob.title} at {selectedJob.company}
                                </Typography>
                                <Typography variant="subtitle2" color="text.secondary">
                                    {selectedJob.location} • {selectedJob.jobType}
                                </Typography>
                            </DialogTitle>
                            <DialogContent dividers>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                    {selectedJob.description || 'No detailed description available.'}
                                </Typography>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setShowJobDetails(false)}>Close</Button>
                                {selectedJob.url && (
                                    <Button
                                        href={selectedJob.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        startIcon={<SearchIcon />}
                                    >
                                        View on Dice
                                    </Button>
                                )}
                            </DialogActions>
                        </>
                    )}
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Paper>
        </Container>
    );
};

export default JobScraper; 