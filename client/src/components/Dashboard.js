import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import {
  Work as WorkIcon,
  Description as DescriptionIcon,
  RecordVoiceOver as InterviewIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import JobScraper from './jobs/JobScraper';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [showJobScraper, setShowJobScraper] = useState(false);

  const features = [
    {
      title: 'Job Search',
      description: 'Search and analyze job postings from multiple sources',
      icon: <WorkIcon sx={{ fontSize: 40 }} />,
      path: '/jobs',
      color: '#1976d2'
    },
    {
      title: 'Resume Builder',
      description: 'Create and optimize your resume for specific job positions',
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      path: '/resume',
      color: '#2e7d32'
    },
    {
      title: 'Mock Interview',
      description: 'Practice interviews with AI-powered feedback',
      icon: <InterviewIcon sx={{ fontSize: 40 }} />,
      path: '/interview',
      color: '#ed6c02'
    }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFeatureClick = (path) => {
    if (path === '/jobs') {
      setShowJobScraper(true);
    } else {
      navigate(path);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {!showJobScraper ? (
        <>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Welcome, {user?.name}!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your AI-powered career development platform
            </Typography>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Quick Access" />
              <Tab label="Recent Activity" />
              <Tab label="Career Insights" />
            </Tabs>

            {activeTab === 0 && (
              <Grid container spacing={3}>
                {features.map((feature, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => handleFeatureClick(feature.path)}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ 
                            p: 1, 
                            borderRadius: 1, 
                            bgcolor: `${feature.color}15`,
                            color: feature.color,
                            mr: 2
                          }}>
                            {feature.icon}
                          </Box>
                          <Typography variant="h6">
                            {feature.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => handleFeatureClick(feature.path)}
                        >
                          Get Started
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {activeTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Recent Job Applications
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h4" sx={{ mr: 2 }}>
                        0
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        applications this month
                      </Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      startIcon={<WorkIcon />}
                      onClick={() => setShowJobScraper(true)}
                    >
                      Start Job Search
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Mock Interviews
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h4" sx={{ mr: 2 }}>
                        0
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        interviews completed
                      </Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      startIcon={<InterviewIcon />}
                      onClick={() => navigate('/interview')}
                    >
                      Start Interview
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Career Insights
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Market Trends
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Start job search to see market insights
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            <BookmarkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Saved Jobs
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            No saved jobs yet
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            <ShareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Job Matches
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Start job search to see matches
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Paper>
        </>
      ) : (
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowForwardIcon />}
            onClick={() => setShowJobScraper(false)}
            sx={{ mb: 2 }}
          >
            Back to Dashboard
          </Button>
          <JobScraper />
        </Box>
      )}
    </Container>
  );
};

export default Dashboard; 