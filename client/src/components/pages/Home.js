import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    Grid,
    Paper,
    Card,
    CardContent,
    CardActions
} from '@mui/material';
import {
    Work as WorkIcon,
    Assessment as AssessmentIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';

const Home = () => {
    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
                <Typography variant="h2" component="h1" gutterBottom>
                    Career AI Coach
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph>
                    Your personalized career development and interview preparation assistant
                </Typography>
            </Box>

            <Grid container spacing={4} sx={{ mb: 8 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <WorkIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h5" component="h2" gutterBottom>
                                Job Search
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Find and analyze job opportunities with AI-powered insights
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button
                                component={RouterLink}
                                to="/jobs"
                                size="large"
                                fullWidth
                            >
                                Start Searching
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h5" component="h2" gutterBottom>
                                Career Coach
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Get personalized resume suggestions and interview preparation
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button
                                component={RouterLink}
                                to="/mcp"
                                size="large"
                                fullWidth
                            >
                                Get Started
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h5" component="h2" gutterBottom>
                                Progress Tracking
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Monitor your career development and interview performance
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button
                                component={RouterLink}
                                to="/mcp"
                                size="large"
                                fullWidth
                            >
                                View Progress
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Home; 