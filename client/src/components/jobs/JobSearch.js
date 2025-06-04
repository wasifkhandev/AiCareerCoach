import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  LinearProgress,
  Fade,
  Skeleton,
} from '@mui/material';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import InsightsIcon from '@mui/icons-material/Insights';
import WorkIcon from '@mui/icons-material/Work';

const JobSearch = () => {
  const { token } = useSelector((state) => state.auth);
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [loadingStage, setLoadingStage] = useState('');

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setSearchResults(null);
      
      // Update loading stages
      setLoadingStage('Scraping jobs from Dice.com...');
      const response = await axios.get(
        `http://localhost:5000/api/jobs/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setLoadingStage('Analyzing job market trends...');
      // Simulate a small delay to show the insights generation stage
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSearchResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error searching jobs');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const renderLoadingSkeleton = () => (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      <Grid item xs={12} md={6}>
        <Card elevation={2}>
          <CardContent>
            <Skeleton variant="text" width="40%" height={32} />
            <Divider sx={{ my: 2 }} />
            {[1, 2, 3].map((index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={20} />
                {index < 3 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width="30%" height={32} />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="95%" height={20} />
            <Skeleton variant="text" width="85%" height={20} />
            <Skeleton variant="text" width="90%" height={20} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Job Search & Market Insights
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Search for jobs and get comprehensive market insights
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
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
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., New York, Remote"
              variant="outlined"
              InputProps={{
                startAdornment: <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              disabled={!keywords || !location || loading}
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Fade in={loading}>
          <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography variant="body1" color="text.secondary">
                {loadingStage}
              </Typography>
            </Box>
            <LinearProgress />
            {renderLoadingSkeleton()}
          </Paper>
        </Fade>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {searchResults && !loading && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Jobs List */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Found Jobs ({searchResults.jobs.length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {searchResults.jobs.map((job, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {job.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {job.company} • {job.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {job.jobType} • {job.salary}
                    </Typography>
                    {index < searchResults.jobs.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Market Insights */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InsightsIcon sx={{ mr: 1, color: 'primary.main' }} />
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
                  {searchResults.insights}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default JobSearch; 