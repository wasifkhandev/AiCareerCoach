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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import axios from 'axios';

const MockInterview = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [response, setResponse] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [interviewStarted, setInterviewStarted] = useState(false);

  const handleStartInterview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        'http://localhost:5000/api/interview/start',
        {
          userId: user.id,
          jobDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setQuestions(response.data.questions.split('\n').filter(q => q.trim()));
      setInterviewStarted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error starting interview');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        'http://localhost:5000/api/interview/evaluate',
        {
          question: questions[currentQuestion],
          response,
          jobDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEvaluation(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error evaluating response');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestion(prev => prev + 1);
    setResponse('');
    setEvaluation(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mock Interview
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Practice your interview skills with AI-powered feedback
      </Typography>

      {!interviewStarted ? (
        <Paper sx={{ p: 3, mt: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Job Description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description to generate relevant interview questions..."
            variant="outlined"
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleStartInterview}
              disabled={!jobDescription || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Start Interview'}
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          <Stepper activeStep={currentQuestion} sx={{ mt: 3, mb: 3 }}>
            {questions.map((_, index) => (
              <Step key={index}>
                <StepLabel>Question {index + 1}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Question {currentQuestion + 1}
            </Typography>
            <Typography variant="body1" paragraph>
              {questions[currentQuestion]}
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={6}
              label="Your Response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response here..."
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {evaluation ? (
                <Button
                  variant="contained"
                  onClick={handleNextQuestion}
                  disabled={currentQuestion === questions.length - 1}
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmitResponse}
                  disabled={!response || loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit Response'}
                </Button>
              )}
            </Box>
          </Paper>

          {evaluation && (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Evaluation
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography
                      variant="body1"
                      component="div"
                      sx={{ whiteSpace: 'pre-line' }}
                    >
                      {evaluation.evaluation}
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
                      {evaluation.suggestions}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default MockInterview; 