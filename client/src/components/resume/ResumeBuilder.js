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
  Tabs,
  Tab,
} from '@mui/material';
import axios from 'axios';

const ResumeBuilder = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        'http://localhost:5000/api/resume/analyze',
        {
          userId: user.id,
          resume,
          jobDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAnalysis(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error analyzing resume');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResume = async () => {
    try {
      setLoading(true);
      setError(null);
      await axios.put(
        'http://localhost:5000/api/resume/update',
        {
          userId: user.id,
          resume,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setError({ type: 'success', message: 'Resume updated successfully' });
    } catch (err) {
      setError({
        type: 'error',
        message: err.response?.data?.message || 'Error updating resume',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Resume Builder
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Create and optimize your resume for specific job positions
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Resume Editor" />
          <Tab label="Resume Analysis" />
        </Tabs>

        {activeTab === 0 ? (
          <>
            <TextField
              fullWidth
              multiline
              rows={12}
              label="Your Resume"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Enter your resume content here..."
              variant="outlined"
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleUpdateResume}
                disabled={!resume || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Resume'}
              </Button>
            </Box>
          </>
        ) : (
          <>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Job Description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description to analyze your resume against..."
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleAnalyze}
                disabled={!resume || !jobDescription || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Analyze Resume'}
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {error && (
        <Alert
          severity={error.type || 'error'}
          sx={{ mt: 2 }}
          onClose={() => setError(null)}
        >
          {error.message}
        </Alert>
      )}

      {analysis && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Analysis
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
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Suggestions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography
                  variant="body1"
                  component="div"
                  sx={{ whiteSpace: 'pre-line' }}
                >
                  {analysis.suggestions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ResumeBuilder; 