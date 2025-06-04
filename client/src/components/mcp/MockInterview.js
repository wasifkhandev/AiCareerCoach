import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    Divider,
    List,
    ListItem,
    ListItemText,
    Chip,
    Stack
} from '@mui/material';
import {
    PlayArrow as PlayArrowIcon,
    Stop as StopIcon,
    Send as SendIcon,
    Star as StarIcon
} from '@mui/icons-material';
import axios from 'axios';

const MockInterview = ({ jobDescription, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [currentResponse, setCurrentResponse] = useState('');
    const [evaluations, setEvaluations] = useState([]);
    const [isRecording, setIsRecording] = useState(false);

    const handleStartInterview = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/mcp/interview', {
                jobDescription
            });

            const parsedQuestions = parseQuestions(response.data.interview);
            setQuestions(parsedQuestions);
            setActiveStep(0);
        } catch (err) {
            setError(err.response?.data?.error || 'Error starting interview');
        } finally {
            setLoading(false);
        }
    };

    const parseQuestions = (interviewText) => {
        // Split the interview text into sections
        const sections = interviewText.split('\n\n');
        return sections.map(section => {
            const lines = section.split('\n');
            return {
                question: lines[0].replace(/^\d+\.\s*/, ''),
                guidance: lines.slice(1).join('\n'),
                type: lines[0].includes('Technical') ? 'technical' :
                      lines[0].includes('Behavioral') ? 'behavioral' : 'situational'
            };
        });
    };

    const handleSubmitResponse = async () => {
        if (!currentResponse.trim()) {
            setError('Please provide a response');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/mcp/evaluate', {
                question: questions[activeStep].question,
                response: currentResponse,
                jobDescription
            });

            setEvaluations([...evaluations, {
                question: questions[activeStep].question,
                response: currentResponse,
                evaluation: response.data.evaluation
            }]);

            setCurrentResponse('');
            
            if (activeStep < questions.length - 1) {
                setActiveStep(activeStep + 1);
            } else {
                onComplete(evaluations);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error evaluating response');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const renderQuestion = () => {
        if (!questions[activeStep]) return null;

        const { question, guidance, type } = questions[activeStep];

        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip
                            label={type.charAt(0).toUpperCase() + type.slice(1)}
                            color={type === 'technical' ? 'primary' : 
                                   type === 'behavioral' ? 'secondary' : 'default'}
                        />
                    </Stack>
                    <Typography variant="h6" gutterBottom>
                        {question}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {guidance}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        label="Your Response"
                        value={currentResponse}
                        onChange={(e) => setCurrentResponse(e.target.value)}
                        disabled={loading}
                    />
                </CardContent>
            </Card>
        );
    };

    const renderEvaluation = (evaluation) => (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                    Question: {evaluation.question}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Your Response: {evaluation.response}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                    {evaluation.evaluation}
                </Typography>
            </CardContent>
        </Card>
    );

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {!questions.length ? (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleStartInterview}
                    disabled={loading}
                    startIcon={<PlayArrowIcon />}
                >
                    Start Interview
                </Button>
            ) : (
                <>
                    <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                        {questions.map((_, index) => (
                            <Step key={index}>
                                <StepLabel>Question {index + 1}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {renderQuestion()}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                        >
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmitResponse}
                            disabled={loading || !currentResponse.trim()}
                            endIcon={<SendIcon />}
                        >
                            Submit Response
                        </Button>
                    </Box>

                    {evaluations.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Previous Evaluations
                            </Typography>
                            {evaluations.map((evaluation, index) => (
                                <Box key={index}>
                                    {renderEvaluation(evaluation)}
                                </Box>
                            ))}
                        </Box>
                    )}
                </>
            )}

            {loading && (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            )}
        </Box>
    );
};

export default MockInterview; 