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
    Snackbar,
    LinearProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Collapse,
    Stack,
    IconButton,
    Tooltip,
    Fade,
    Zoom,
    Grow,
    useTheme,
    alpha
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
    Description as DescriptionIcon,
    OpenInNew as OpenInNewIcon,
    TrendingUp as TrendingUpIcon,
    Lightbulb as LightbulbIcon,
    Psychology as PsychologyIcon,
    EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const LoadingAnimation = ({ stage }) => {
    const theme = useTheme();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((oldProgress) => {
                const diff = Math.random() * 10;
                return Math.min(oldProgress + diff, 100);
            });
        }, 500);

        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <Fade in={true}>
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 4, 
                    mt: 3, 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <CircularProgress 
                        size={32} 
                        sx={{ 
                            mr: 2,
                            color: theme.palette.primary.main
                        }} 
                    />
                    <Typography variant="h6" color="primary">
                        {stage}
                    </Typography>
                </Box>
                <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                        }
                    }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Please wait while we analyze the job market...
                </Typography>
            </Paper>
        </Fade>
    );
};

const JobCard = ({ job, index }) => {
    const [expanded, setExpanded] = useState(false);
    const theme = useTheme();

    // Format the description to handle line breaks and bullet points
    const formatDescription = (description) => {
        if (!description) return 'No detailed description available.';
        
        // Split by common line break patterns
        const lines = description.split(/\n|\r\n|\r/);
        
        // Process each line
        return lines.map((line, i) => {
            // Handle bullet points
            if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                return `• ${line.trim().substring(1).trim()}`;
            }
            // Handle numbered lists
            if (/^\d+\./.test(line.trim())) {
                return line.trim();
            }
            // Handle section headers
            if (line.trim().toUpperCase() === line.trim() && line.trim().length > 0) {
                return `\n${line.trim()}\n`;
            }
            return line.trim();
        }).join('\n');
    };

    // Get preview of description (first 200 characters)
    const getDescriptionPreview = (description) => {
        if (!description) return 'No detailed description available.';
        const formatted = formatDescription(description);
        return formatted.length > 200 ? formatted.substring(0, 200) + '...' : formatted;
    };

    return (
        <Grow in={true} timeout={500 + (index * 100)}>
            <Card 
                elevation={2} 
                sx={{ 
                    mb: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4]
                    }
                }}
            >
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                        {job.title}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            icon={<BusinessIcon />}
                            label={job.company}
                            variant="outlined"
                            size="small"
                        />
                        <Chip
                            icon={<LocationIcon />}
                            label={job.location}
                            variant="outlined"
                            size="small"
                        />
                        {job.salary && (
                            <Chip
                                icon={<MoneyIcon />}
                                label={job.salary}
                                variant="outlined"
                                size="small"
                            />
                        )}
                        {job.jobType && (
                            <Chip
                                icon={<WorkIcon />}
                                label={job.jobType}
                                variant="outlined"
                                size="small"
                            />
                        )}
                    </Stack>

                    <Box sx={{ mt: 2 }}>
                        <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                                whiteSpace: 'pre-line',
                                '& ul': { pl: 2 },
                                '& li': { mb: 1 },
                                '& h3': { mt: 2, mb: 1, color: 'primary.main', fontWeight: 'bold' },
                                '& h4': { mt: 1.5, mb: 1, color: 'text.secondary', fontWeight: 'medium' },
                                '& p': { mb: 1 },
                                '& strong': { color: 'primary.main' },
                                '& em': { color: 'text.secondary' },
                                '& ul, & ol': { pl: 2, mb: 1 },
                                '& li': { mb: 0.5 },
                                '& br': { mb: 1 }
                            }}
                        >
                            {expanded ? formatDescription(job.description) : getDescriptionPreview(job.description)}
                        </Typography>
                        <Button
                            size="small"
                            onClick={() => setExpanded(!expanded)}
                            sx={{ mt: 1 }}
                        >
                            {expanded ? 'Show Less' : 'Show More'}
                        </Button>
                    </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    {job.url && (
                        <Button
                            size="small"
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<OpenInNewIcon />}
                            variant="contained"
                        >
                            View on Dice
                        </Button>
                    )}
                </CardActions>
            </Card>
        </Grow>
    );
};

const NextSteps = () => {
    const navigate = useNavigate();
    const theme = useTheme();

    const handleCareerCoach = () => {
        navigate('/mcp');
    };

    return (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Card 
                elevation={2}
                sx={{ 
                    maxWidth: 400,
                    width: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                    }
                }}
            >
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PsychologyIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h6" sx={{ ml: 1 }}>
                            Career Coach
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Get personalized career guidance and advice from our AI-powered career coach
                    </Typography>
                </CardContent>
                <CardActions>
                    <Button 
                        fullWidth 
                        variant="contained"
                        size="large"
                        startIcon={<PsychologyIcon />}
                        onClick={handleCareerCoach}
                        sx={{ 
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 'medium'
                        }}
                    >
                        Talk to Career Coach
                    </Button>
                </CardActions>
            </Card>
        </Box>
    );
};

const JobScraper = () => {
    const { token } = useSelector((state) => state.auth);
    const theme = useTheme();
    const [formData, setFormData] = useState({
        keywords: '',
        location: '',
    });
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [error, setError] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [insights, setInsights] = useState(null);
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
        setLoadingStage('Scraping jobs from Dice.com...');
        setError(null);
        setJobs([]);
        setInsights(null);
        
        try {
            const response = await axios.get(`${API_URL}/jobs/search`, {
                params: {
                    keywords: keywords,
                    location: location
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setLoadingStage('Analyzing job market trends...');
            await new Promise(resolve => setTimeout(resolve, 1500));

            setJobs(response.data.jobs || []);
            setInsights(response.data.insights);

            setSnackbar({
                open: true,
                message: `Successfully found ${response.data.jobs.length} jobs and generated insights`,
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
            setLoadingStage('');
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Job Market Analysis
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Search for jobs and get comprehensive market insights
            </Typography>

            <Paper 
                elevation={3} 
                sx={{ 
                    p: 3, 
                    mt: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.8)
                }}
            >
                <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth
                            name="keywords"
                            label="Keywords"
                            value={formData.keywords}
                            onChange={handleChange}
                            placeholder="e.g., machine learning, software engineer"
                            variant="outlined"
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth
                            name="location"
                            label="Location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g., New York, Remote"
                            variant="outlined"
                            InputProps={{
                                startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleScrape}
                            disabled={!formData.keywords || !formData.location || loading}
                            sx={{ height: '56px' }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {loading && <LoadingAnimation stage={loadingStage} />}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {jobs.length > 0 && !loading && (
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {/* Jobs List */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={2} sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WorkIcon color="primary" />
                                    Found Jobs ({jobs.length})
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                {jobs.map((job, index) => (
                                    <JobCard key={index} job={job} index={index} />
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Market Insights */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={2} sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">
                                        Market Insights
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Typography
                                    variant="body1"
                                    component="div"
                                    sx={{ 
                                        whiteSpace: 'pre-line',
                                        '& ul': { pl: 2 },
                                        '& li': { mb: 1 },
                                        '& h3': { mt: 2, mb: 1, color: 'primary.main' },
                                        '& h4': { mt: 1.5, mb: 1, color: 'text.secondary' }
                                    }}
                                >
                                    {insights}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {jobs.length > 0 && !loading && <NextSteps />}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default JobScraper; 