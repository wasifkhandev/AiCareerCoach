import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Stepper,
    Step,
    StepLabel,
    Button,
    TextField,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    Stack
} from '@mui/material';
import axios from '../utils/axios';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import LoaderOverlay from './LoaderOverlay';

const steps = ['Skills Assessment', 'Career Path Analysis', 'Learning Path', 'Progress Tracking'];

const JobInsightCard = ({ insight }) => {
    const [showMore, setShowMore] = useState(false);
    const preview =
        insight.description.length > 150
            ? insight.description.slice(0, 150) + '...'
            : insight.description;

    return (
        <Card
            sx={{
                mb: 2,
                minWidth: 280,
                maxWidth: 350,
                flex: '1 1 300px',
                boxShadow: 3,
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: 6 }
            }}
        >
            <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                    {insight.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {insight.company} &mdash; {insight.location}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Type:</strong> {insight.jobType} | <strong>Salary:</strong> {insight.salary}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    {showMore ? insight.description : preview}
                </Typography>
                <Button
                    size="small"
                    onClick={() => setShowMore((prev) => !prev)}
                    sx={{ mt: 1, textTransform: 'none' }}
                    endIcon={showMore ? <ExpandLess /> : <ExpandMore />}
                >
                    {showMore ? 'Show Less' : 'Show More'}
                </Button>
                {insight.url && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        <a
                            href={insight.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1976d2', textDecoration: 'underline' }}
                        >
                            View Job Posting
                        </a>
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

const MyCareerPath = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState('');
    const [experience, setExperience] = useState('');
    const [goals, setGoals] = useState('');
    const [careerPath, setCareerPath] = useState(null);
    const [skillAnalysis, setSkillAnalysis] = useState(null);
    const [learningPath, setLearningPath] = useState(null);
    const [progress, setProgress] = useState(null);

    const handleAddSkill = () => {
        if (newSkill && !skills.includes(newSkill)) {
            setSkills([...skills, newSkill]);
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    const handleNext = async () => {
        setLoading(true);
        setError(null);

        try {
            switch (activeStep) {
                case 0:
                    // Get career path analysis
                    const careerResponse = await axios.post('/api/mcp/analyze', {
                        skills,
                        experience,
                        goals
                    });
                    setCareerPath(careerResponse.data);
                    break;

                case 1:
                    // Get skill analysis
                    const skillResponse = await axios.post('/api/mcp/skills', {
                        currentSkills: skills,
                        targetRole: goals
                    });
                    setSkillAnalysis(skillResponse.data);
                    break;

                case 2:
                    // Get learning path
                    const learningResponse = await axios.post('/api/mcp/learning-path', {
                        skills,
                        careerPath: careerPath.careerPath
                    });
                    setLearningPath(learningResponse.data);
                    break;

                case 3:
                    // Track progress
                    const progressResponse = await axios.post('/api/mcp/progress', {
                        userId: 'current-user', // Replace with actual user ID
                        skills,
                        completedMilestones: [] // Add completed milestones
                    });
                    setProgress(progressResponse.data);
                    break;
            }

            setActiveStep((prevStep) => prevStep + 1);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const isStepValid = () => {
        switch (activeStep) {
            case 0:
                return skills.length > 0 && experience.trim() !== '' && goals.trim() !== '';
            case 1:
                return careerPath !== null;
            case 2:
                return skillAnalysis !== null;
            case 3:
                return learningPath !== null;
            default:
                return false;
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Add Your Skills
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                                label="Add Skill"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                size="small"
                            />
                            <Button variant="contained" onClick={handleAddSkill}>
                                Add
                            </Button>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {skills.map((skill) => (
                                <Chip
                                    key={skill}
                                    label={skill}
                                    onDelete={() => handleRemoveSkill(skill)}
                                    sx={{ m: 0.5 }}
                                />
                            ))}
                        </Stack>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Experience"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Career Goals"
                            value={goals}
                            onChange={(e) => setGoals(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    </Box>
                );

            case 1:
                return careerPath && (
                    <Box sx={{ mt: 2 }}>
                        {/* Career Path Card */}
                        <Paper
                            elevation={4}
                            sx={{
                                p: 3,
                                borderLeft: '6px solid #1976d2',
                                background: 'linear-gradient(90deg, #e3f2fd 0%, #fff 100%)',
                                mb: 3
                            }}
                        >
                            <Typography variant="h5" color="primary" gutterBottom>
                                🚀 Your Personalized Career Path
                            </Typography>
                            <Box sx={{ pl: 1 }}>
                                {careerPath.careerPath
                                    .split('\n')
                                    .filter(line => line.trim() !== '')
                                    .map((line, idx) => (
                                        <Typography
                                            key={idx}
                                            variant={line.endsWith(':') ? 'subtitle1' : 'body1'}
                                            sx={{
                                                fontWeight: line.endsWith(':') ? 600 : 400,
                                                mt: line.endsWith(':') ? 2 : 0,
                                                display: 'flex',
                                                alignItems: 'flex-start'
                                            }}
                                        >
                                            {!line.endsWith(':') && (
                                                <span style={{ color: '#1976d2', marginRight: 8, fontSize: 18 }}>•</span>
                                            )}
                                            {line}
                                        </Typography>
                                    ))}
                            </Box>
                        </Paper>

                        {/* Relevant Job Market Insights */}
                        {careerPath.jobInsights && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    💼 Relevant Job Market Insights
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {careerPath.jobInsights.map((insight, index) => (
                                        <JobInsightCard key={index} insight={insight} />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                );

            case 2:
                return skillAnalysis && (
                    <Box sx={{ mt: 2 }}>
                        {/* Skill Analysis Card */}
                        <Paper
                            elevation={4}
                            sx={{
                                p: 3,
                                borderLeft: '6px solid #388e3c',
                                background: 'linear-gradient(90deg, #e8f5e9 0%, #fff 100%)',
                                mb: 3
                            }}
                        >
                            <Typography variant="h5" color="success.main" gutterBottom>
                                🧩 Skill Gap Analysis
                            </Typography>
                            <Box sx={{ pl: 1 }}>
                                {skillAnalysis.skillAnalysis
                                    .split('\n')
                                    .filter(line => line.trim() !== '')
                                    .map((line, idx) => (
                                        <Typography
                                            key={idx}
                                            variant={line.endsWith(':') ? 'subtitle1' : 'body1'}
                                            sx={{
                                                fontWeight: line.endsWith(':') ? 600 : 400,
                                                mt: line.endsWith(':') ? 2 : 0,
                                                display: 'flex',
                                                alignItems: 'flex-start'
                                            }}
                                        >
                                            {!line.endsWith(':') && (
                                                <span style={{ color: '#388e3c', marginRight: 8, fontSize: 18 }}>•</span>
                                            )}
                                            {line}
                                        </Typography>
                                    ))}
                            </Box>
                        </Paper>
                        {/* Learning Path (if available) */}
                        {learningPath && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Learning Path
                                </Typography>
                                <Card>
                                    <CardContent>
                                        <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                                            {learningPath.learningPath}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Box>
                        )}
                    </Box>
                );

            case 3:
                return progress && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Progress Tracking
                        </Typography>
                        <Card>
                            <CardContent>
                                <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                                    {progress.progressAnalysis}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <LoaderOverlay open={loading} message={
                activeStep === 0 ? 'Analyzing your career path...' :
                activeStep === 1 ? 'Analyzing your skills...' :
                activeStep === 2 ? 'Generating your learning path...' :
                activeStep === 3 ? 'Tracking your progress...' :
                'Loading...'
            } />
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom align="center">
                    My Career Path
                </Typography>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {renderStepContent(activeStep)}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={loading || !isStepValid()}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Next'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default MyCareerPath; 