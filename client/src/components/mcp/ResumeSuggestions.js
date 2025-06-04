import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Stack,
    TextField,
    IconButton,
    Collapse
} from '@mui/material';
import {
    Description as DescriptionIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Star as StarIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    Build as BuildIcon
} from '@mui/icons-material';
import axios from 'axios';

const ResumeSuggestions = ({ jobDescription, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [suggestions, setSuggestions] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [notes, setNotes] = useState({});

    const handleGenerateSuggestions = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/mcp/resume', {
                jobDescription
            });

            const parsedSuggestions = parseSuggestions(response.data.suggestions);
            setSuggestions(parsedSuggestions);
            
            // Initialize expanded state for each section
            const initialExpanded = {};
            Object.keys(parsedSuggestions).forEach(section => {
                initialExpanded[section] = true;
            });
            setExpandedSections(initialExpanded);
        } catch (err) {
            setError(err.response?.data?.error || 'Error generating suggestions');
        } finally {
            setLoading(false);
        }
    };

    const parseSuggestions = (suggestionsText) => {
        const sections = suggestionsText.split('\n\n');
        const parsed = {};

        sections.forEach(section => {
            const lines = section.split('\n');
            const title = lines[0].replace(/^\d+\.\s*/, '');
            const content = lines.slice(1).filter(line => line.trim());
            parsed[title] = content;
        });

        return parsed;
    };

    const handleToggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleNoteChange = (section, value) => {
        setNotes(prev => ({
            ...prev,
            [section]: value
        }));
    };

    const getSectionIcon = (section) => {
        switch (section.toLowerCase()) {
            case 'key skills':
                return <BuildIcon />;
            case 'experience points':
                return <WorkIcon />;
            case 'education':
                return <SchoolIcon />;
            default:
                return <StarIcon />;
        }
    };

    const renderSection = (title, content) => (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ListItemIcon>
                        {getSectionIcon(title)}
                    </ListItemIcon>
                    <Typography variant="h6" sx={{ flex: 1 }}>
                        {title}
                    </Typography>
                    <IconButton onClick={() => handleToggleSection(title)}>
                        {expandedSections[title] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                
                <Collapse in={expandedSections[title]}>
                    <List>
                        {content.map((item, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    <CheckCircleIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText primary={item} />
                            </ListItem>
                        ))}
                    </List>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        variant="outlined"
                        label="Your Notes"
                        value={notes[title] || ''}
                        onChange={(e) => handleNoteChange(title, e.target.value)}
                        placeholder="Add your notes or action items here..."
                    />
                </Collapse>
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

            {!suggestions ? (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerateSuggestions}
                    disabled={loading}
                    startIcon={<DescriptionIcon />}
                >
                    Generate Resume Suggestions
                </Button>
            ) : (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        Personalized Resume Suggestions
                    </Typography>
                    
                    {Object.entries(suggestions).map(([title, content]) => (
                        <Box key={title}>
                            {renderSection(title, content)}
                        </Box>
                    ))}

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => onComplete({ suggestions, notes })}
                        >
                            Save Progress
                        </Button>
                    </Box>
                </Box>
            )}

            {loading && (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            )}
        </Box>
    );
};

export default ResumeSuggestions; 