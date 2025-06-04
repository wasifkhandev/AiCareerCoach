const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const User = require('../models/User');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Start a mock interview
router.post('/start', async (req, res) => {
  try {
    const { userId, jobDescription } = req.body;

    // Get user's profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate interview questions based on job description and user's experience
    const questions = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert interviewer. Generate relevant interview questions using the STAR method based on the job description and candidate's experience."
        },
        {
          role: "user",
          content: `Generate 5 interview questions using the STAR method for this position. Consider the candidate's experience:\n
          Job Description:\n${jobDescription}\n\n
          Candidate Experience:\n${user.jobHistory.map(job => `
            Position: ${job.title}
            Company: ${job.company}
            Description: ${job.description}
          `).join('\n')}`
        }
      ]
    });

    res.json({
      questions: questions.choices[0].message.content,
      interviewId: Date.now().toString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error starting interview' });
  }
});

// Evaluate interview response
router.post('/evaluate', async (req, res) => {
  try {
    const { question, response, jobDescription } = req.body;

    // Evaluate the response using STAR method
    const evaluation = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert interviewer. Evaluate the candidate's response using the STAR method and provide constructive feedback."
        },
        {
          role: "user",
          content: `Evaluate this interview response using the STAR method. Consider:\n
          1. Situation: Was the context clearly described?\n
          2. Task: Was the objective clearly stated?\n
          3. Action: Were the actions taken clearly explained?\n
          4. Result: Was the outcome clearly communicated?\n\n
          Question: ${question}\n
          Response: ${response}\n
          Job Description: ${jobDescription}`
        }
      ]
    });

    // Generate improvement suggestions
    const suggestions = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach. Provide specific suggestions to improve the interview response."
        },
        {
          role: "user",
          content: `Based on the evaluation, provide specific suggestions to improve this interview response. Include:\n
          1. What was done well\n
          2. What could be improved\n
          3. Specific examples of better responses\n\n
          Question: ${question}\n
          Response: ${response}`
        }
      ]
    });

    res.json({
      evaluation: evaluation.choices[0].message.content,
      suggestions: suggestions.choices[0].message.content
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error evaluating response' });
  }
});

module.exports = router; 