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
} from '@mui/material';
import axios from 'axios';

const JobSearch = () => {
  const { token } = useSelector((state) => state.auth);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        'http://localhost:5000/api/jobs/analyze',
        { jobDescription },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAnalysis(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error analyzing job description');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Job Search & Analysis
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Paste a job description to analyze its requirements and get personalized insights
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={6}
          label="Job Description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          variant="outlined"
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleAnalyze}
            disabled={!jobDescription || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Analyze Job'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {analysis && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Job Analysis
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography
                  variant="body1"
                  component="div"
                  sx={{ whiteSpace: 'pre-line' }}
                >
                  {analysis.analysis}
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