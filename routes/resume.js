const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const User = require('../models/User');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Analyze resume and provide suggestions
router.post('/analyze', async (req, res) => {
  try {
    const { userId, resume, jobDescription } = req.body;

    // Get user's job history and skills
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create context from user's history
    const userContext = `
      User's Job History:
      ${user.jobHistory.map(job => `
        Position: ${job.title}
        Company: ${job.company}
        Description: ${job.description}
        Duration: ${job.startDate} to ${job.endDate}
      `).join('\n')}

      User's Skills:
      ${user.skills.join(', ')}
    `;

    // Analyze resume against job description
    const analysis = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert resume reviewer and career coach. Analyze the resume against the job description and provide specific suggestions for improvement."
        },
        {
          role: "user",
          content: `Please analyze this resume against the job description and provide:\n
          1. Skills match analysis\n
          2. Experience relevance\n
          3. Specific improvements needed\n
          4. Keywords to add\n
          5. Formatting suggestions\n\n
          User Context:\n${userContext}\n\n
          Resume:\n${resume}\n\n
          Job Description:\n${jobDescription}`
        }
      ]
    });

    // Generate tailored resume suggestions
    const suggestions = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer. Provide specific, actionable suggestions to improve the resume for this job."
        },
        {
          role: "user",
          content: `Based on the analysis, provide specific suggestions to improve the resume for this job. Include:\n
          1. Specific phrases to add\n
          2. Experience to highlight\n
          3. Skills to emphasize\n
          4. Format changes\n\n
          Resume:\n${resume}\n\n
          Job Description:\n${jobDescription}`
        }
      ]
    });

    res.json({
      analysis: analysis.choices[0].message.content,
      suggestions: suggestions.choices[0].message.content
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error analyzing resume' });
  }
});

// Update user's resume
router.put('/update', async (req, res) => {
  try {
    const { userId, resume } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { resume },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Resume updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating resume' });
  }
});

module.exports = router; 