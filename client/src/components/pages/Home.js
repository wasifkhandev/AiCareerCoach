import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    useTheme
} from '@mui/material';
import {
    Work as WorkIcon,
    Assessment as AssessmentIcon,
    School as SchoolIcon
} from '@mui/icons-material';

const Home = () => {
    const theme = useTheme();

    return (
        <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: 1, mb: 1, fontFamily: 'Inter, Roboto, sans-serif' }}>
                    Career AI Coach
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    Your next-gen career development and job search assistant
                </Typography>
            </Box>
            <Grid
                container
                spacing={4}
                justifyContent="center"
                alignItems="center"
            >
                <Grid item xs={12} sm={6} md={6} display="flex" justifyContent="center">
                    <Card
                        sx={{
                            borderRadius: 5,
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                            backdropFilter: 'blur(8px)',
                            background: 'rgba(255,255,255,0.95)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-6px) scale(1.03)',
                                boxShadow: '0 16px 40px 0 rgba(31, 38, 135, 0.18)',
                            },
                            p: 2,
                            textAlign: 'center',
                            width: '100%',
                            minWidth: 320,
                            maxWidth: 380,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: 340,
                        }}
                    >
                        <WorkIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                            Job Search
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            Discover and analyze job opportunities with AI-powered insights.
                        </Typography>
                        <CardActions sx={{ justifyContent: 'center', mt: 'auto' }}>
                            <Button
                                component={RouterLink}
                                to="/jobs"
                                size="large"
                                variant="contained"
                                color="primary"
                                sx={{ borderRadius: 3, px: 4, fontWeight: 600, fontSize: 18, boxShadow: 'none' }}
                            >
                                Start Searching
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={6} display="flex" justifyContent="center">
                    <Card
                        sx={{
                            borderRadius: 5,
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                            backdropFilter: 'blur(8px)',
                            background: 'rgba(255,255,255,0.95)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-6px) scale(1.03)',
                                boxShadow: '0 16px 40px 0 rgba(31, 38, 135, 0.18)',
                            },
                            p: 2,
                            textAlign: 'center',
                            width: '100%',
                            minWidth: 320,
                            maxWidth: 380,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: 340,
                        }}
                    >
                        <SchoolIcon sx={{ fontSize: 48, color: theme.palette.success.main, mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                            Career Coach
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            Get personalized resume, skill, and interview coaching for your dream job.
                        </Typography>
                        <CardActions sx={{ justifyContent: 'center', mt: 'auto' }}>
                            <Button
                                component={RouterLink}
                                to="/mcp"
                                size="large"
                                variant="contained"
                                color="success"
                                sx={{ borderRadius: 3, px: 4, fontWeight: 600, fontSize: 18, boxShadow: 'none' }}
                            >
                                Get Started
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Home; 