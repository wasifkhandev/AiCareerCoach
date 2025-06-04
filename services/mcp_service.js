const { OpenAI } = require('openai');
const PineconeService = require('./pinecone_service');
require('dotenv').config();

class MCPService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.pineconeService = new PineconeService();
    }

    async generateResumeSuggestions(userProfile, jobDescription) {
        try {
            // Get user's job history and skills from Pinecone
            const userHistory = await this.pineconeService.querySimilarJobs(userProfile.skills.join(' '), {
                userId: userProfile.id
            });

            // Create context from user history
            const context = {
                userProfile,
                jobHistory: userHistory,
                targetJob: jobDescription
            };

            // Generate personalized suggestions
            const prompt = `Based on the following context, provide personalized resume suggestions:

            User Profile:
            - Skills: ${userProfile.skills.join(', ')}
            - Experience: ${userProfile.experience} years
            - Education: ${userProfile.education}
            - Current Role: ${userProfile.currentRole}

            Target Job:
            ${jobDescription}

            Previous Job History:
            ${userHistory.map(job => `- ${job.title} at ${job.company}`).join('\n')}

            Please provide:
            1. Key skills to highlight
            2. Experience points to emphasize
            3. Achievements to showcase
            4. Education and certifications to mention
            5. Formatting and structure suggestions
            6. Keywords to include
            7. Areas for improvement

            Format the response in clear sections with bullet points.`;

            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error generating resume suggestions:', error);
            throw error;
        }
    }

    async conductMockInterview(jobDescription, userProfile) {
        try {
            // Get similar job interviews from Pinecone
            const similarJobs = await this.pineconeService.querySimilarJobs(jobDescription);

            // Generate interview questions using STAR method
            const prompt = `Create a mock interview based on this job description using the STAR method:

            Job Description:
            ${jobDescription}

            User Profile:
            - Skills: ${userProfile.skills.join(', ')}
            - Experience: ${userProfile.experience} years
            - Current Role: ${userProfile.currentRole}

            Please provide:
            1. 5 technical questions
            2. 5 behavioral questions
            3. 3 situational questions
            4. Expected answers for each question
            5. Evaluation criteria
            6. Follow-up questions

            Format each question with:
            - Question
            - STAR framework guidance
            - Expected answer structure
            - Key points to cover
            - Evaluation criteria`;

            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1500
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error conducting mock interview:', error);
            throw error;
        }
    }

    async evaluateInterviewResponse(question, response, jobDescription) {
        try {
            const prompt = `Evaluate this interview response using the STAR method:

            Question: ${question}
            Response: ${response}
            Job Context: ${jobDescription}

            Please evaluate:
            1. Situation clarity
            2. Task description
            3. Action taken
            4. Results achieved
            5. Overall effectiveness
            6. Areas for improvement
            7. Score (1-10)
            8. Specific feedback

            Format the response in clear sections with bullet points.`;

            const evaluation = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 500
            });

            return evaluation.choices[0].message.content;
        } catch (error) {
            console.error('Error evaluating interview response:', error);
            throw error;
        }
    }

    async trackProgress(userId, session) {
        try {
            // Store interview/resume session in Pinecone
            const sessionData = {
                userId,
                type: session.type, // 'interview' or 'resume'
                date: new Date().toISOString(),
                jobDescription: session.jobDescription,
                feedback: session.feedback,
                score: session.score,
                improvements: session.improvements
            };

            await this.pineconeService.storeSession(sessionData);
            return sessionData;
        } catch (error) {
            console.error('Error tracking progress:', error);
            throw error;
        }
    }

    async getProgressReport(userId) {
        try {
            // Get all sessions for the user
            const sessions = await this.pineconeService.querySimilarJobs('', {
                userId,
                type: { $in: ['interview', 'resume'] }
            });

            // Generate progress report
            const prompt = `Generate a progress report based on these sessions:

            ${sessions.map(session => `
            Type: ${session.type}
            Date: ${session.date}
            Score: ${session.score}
            Feedback: ${session.feedback}
            Improvements: ${session.improvements}
            `).join('\n')}

            Please provide:
            1. Overall progress summary
            2. Strengths identified
            3. Areas needing improvement
            4. Recommendations
            5. Next steps

            Format the response in clear sections with bullet points.`;

            const report = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            });

            return report.choices[0].message.content;
        } catch (error) {
            console.error('Error generating progress report:', error);
            throw error;
        }
    }
}

module.exports = MCPService; 