const axios = require('axios');
const cheerio = require('cheerio');
const PineconeService = require('./pinecone_service');
const { OpenAI } = require('openai');
const puppeteer = require('puppeteer');
const { PineconeClient } = require('@pinecone-database/pinecone');
require('dotenv').config();

class JobScraperService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.pineconeService = new PineconeService();
        this.browser = null;
    }

    async initialize() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async scrapeDiceJobs(keywords, location, limit = 3) {
        try {
            console.log(`Scraping Dice jobs for: ${keywords} in ${location} via public site`);
            
            await this.initialize();
            const page = await this.browser.newPage();
            
            // Set a realistic viewport and user agent
            await page.setViewport({ width: 1280, height: 800 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Add headers to mimic a real browser
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            });
            
            // Set default navigation timeout
            page.setDefaultNavigationTimeout(60000); // 60 seconds
            
            // Format the search URL
            const searchUrl = `https://www.dice.com/jobs?q=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`;
            
            // Navigate to the search page with retry logic
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                try {
                    await page.goto(searchUrl, { 
                        waitUntil: 'domcontentloaded',
                        timeout: 60000
                    });
                    break;
                } catch (error) {
                    retryCount++;
                    if (retryCount === maxRetries) {
                        throw error;
                    }
                    console.log(`Retry ${retryCount} for search page`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            // Wait for the main content to load with increased timeout
            await page.waitForSelector('main', { timeout: 10000 }).catch(() => {
                console.log('Main content container not found');
            });
            
            // Updated selectors for Dice.com's current structure
            const jobCardSelectors = [
                'div[data-testid="job-search-results-container"] > div.flex.flex-col.gap-4'
            ];
            
            let jobCardsFound = false;
            for (const selector of jobCardSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 10000 }); // Increased timeout
                    console.log(`Found job cards using selector: ${selector}`);
                    jobCardsFound = true;
                    break;
                } catch (error) {
                    console.log(`Selector ${selector} not found`);
                }
            }
            
            if (!jobCardsFound) {
                throw new Error('No jobs found on Dice.com');
            }
            
            // Extract job information with updated selectors
            const jobSummaries = await page.evaluate((limit, selectors) => {
                let cards = [];
                for (const selector of selectors) {
                    cards = document.querySelectorAll(selector + ' > div[data-id]');
                    if (cards.length > 0) break;
                }
                
                const jobs = [];
                
                for (let i = 0; i < Math.min(cards.length, limit); i++) {
                    const card = cards[i];
                    try {
                        // Updated selectors for current Dice.com structure
                        const titleElement = card.querySelector('a[data-testid="job-search-job-detail-link"]');
                        const companyElement = card.querySelector('a[href^="/company-profile/"] p');
                        const locationElement = card.querySelector('.text-sm.font-normal.text-zinc-600:nth-of-type(1)');
                        const postedDateElement = card.querySelector('.text-sm.font-normal.text-zinc-600:nth-of-type(2)');
                        const jobTypeElement = card.querySelector('[aria-labelledby="employmentType-label"] p');
                        const salaryElement = card.querySelector('[aria-labelledby="salary-label"]');
                        const descriptionElement = card.querySelector('.line-clamp-2');
                        
                        if (titleElement && companyElement) {
                            jobs.push({
                                title: titleElement.textContent.trim(),
                                company: companyElement.textContent.trim(),
                                location: locationElement ? locationElement.textContent.trim() : '',
                                salary: salaryElement ? salaryElement.textContent.trim() : 'Not specified',
                                postedDate: postedDateElement ? postedDateElement.textContent.trim() : '',
                                jobType: jobTypeElement ? jobTypeElement.textContent.trim() : '',
                                url: titleElement.href,
                                source: 'Dice',
                                description: descriptionElement ? descriptionElement.textContent.trim() : ''
                            });
                        }
                    } catch (error) {
                        console.error('Error parsing job card:', error);
                    }
                }
                return jobs;
            }, limit, jobCardSelectors);

            if (jobSummaries.length === 0) {
                throw new Error('No jobs found on Dice.com');
            }

            // Process jobs sequentially instead of in parallel to avoid overwhelming the server
            const jobsWithFullDetails = [];
            for (const jobSummary of jobSummaries) {
                try {
                    const fullDescription = await this.getFullJobDescription(page, jobSummary.url);
                    const job = { ...jobSummary, description: fullDescription };

                    // Get insights using the full job object
                    const insights = await this.getJobInsights(job);
                    job.insights = insights;

                    // Store in vector DB with proper error handling
                    try {
                        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        await this.storeJobInVectorDB({ 
                            ...job, 
                            id: jobId 
                        });
                        job.id = jobId;
                        console.log(`Successfully stored job ${job.title} in vector DB`);
                    } catch (error) {
                        console.error('Error storing in vector DB:', error);
                        // Continue without failing
                    }

                    jobsWithFullDetails.push(job);
                } catch (error) {
                    console.error(`Error processing job ${jobSummary.title}:`, error);
                    jobsWithFullDetails.push({ 
                        ...jobSummary, 
                        description: `Failed to process job: ${error.message}` 
                    });
                }
            }

            await page.close();
            console.log(`Successfully scraped and processed ${jobsWithFullDetails.length} jobs from Dice public site.`);
            return jobsWithFullDetails;
        } catch (error) {
            console.error('Error scraping Dice jobs:', error);
            if (this.browser) {
                await this.close();
            }
            throw new Error(`Failed to scrape Dice jobs: ${error.message}`);
        }
    }

    async getFullJobDescription(page, jobUrl) {
        try {
            // Set default navigation timeout for this page
            page.setDefaultNavigationTimeout(60000); // 60 seconds
            
            // Navigate to the job details page with retry logic
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
                try {
                    await page.goto(jobUrl, { 
                        waitUntil: 'domcontentloaded',
                        timeout: 60000
                    });
                    break; // If successful, break the retry loop
                } catch (error) {
                    retryCount++;
                    if (retryCount === maxRetries) {
                        throw error;
                    }
                    console.log(`Retry ${retryCount} for ${jobUrl}`);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                }
            }

            // Wait for the page to be fully loaded using a more reliable method
            await page.evaluate(() => {
                return new Promise((resolve) => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        window.addEventListener('load', resolve);
                    }
                });
            });

            // Try to get the job description using multiple approaches
            let description = '';

            // Approach 1: Try the main job description container
            try {
                const mainSelector = 'div[data-testid="job-description"]';
                await page.waitForSelector(mainSelector, { timeout: 10000 });
                description = await page.evaluate((selector) => {
                    const element = document.querySelector(selector);
                    return element ? element.textContent.trim() : '';
                }, mainSelector);
            } catch (error) {
                console.log('Main selector not found, trying alternatives');
            }

            // Approach 2: Try alternative selectors if main selector fails
            if (!description || description.length < 50) {
                const alternativeSelectors = [
                    'div[data-cy="job-description"]',
                    'div[class*="job-description"]',
                    'div[class*="description"]',
                    'div[itemprop="description"]',
                    'div[class*="job-details"]',
                    'div[class*="jobDescription"]',
                    'div[class*="job-detail-description"]',
                    'div[class*="job-detail__description"]'
                ];

                for (const selector of alternativeSelectors) {
                    try {
                        const element = await page.$(selector);
                        if (element) {
                            const text = await page.evaluate(el => el.textContent.trim(), element);
                            if (text && text.length > 50) {
                                description = text;
                                console.log(`Found description using selector: ${selector}`);
                                break;
                            }
                        }
                    } catch (error) {
                        console.log(`Selector ${selector} not found`);
                    }
                }
            }

            // Approach 3: Try to get content from the main content area
            if (!description || description.length < 50) {
                try {
                    const mainContent = await page.$('main');
                    if (mainContent) {
                        const text = await page.evaluate(el => el.textContent.trim(), mainContent);
                        if (text && text.length > 50) {
                            description = text;
                            console.log('Falling back to main content text');
                        }
                    }
                } catch (error) {
                    console.log('Could not get main content text');
                }
            }

            // Approach 4: Try to get any meaningful content from the page
            if (!description || description.length < 50) {
                try {
                    const bodyText = await page.evaluate(() => {
                        const content = document.body.textContent.trim();
                        // Remove excessive whitespace and normalize
                        return content.replace(/\s+/g, ' ').trim();
                    });
                    
                    if (bodyText && bodyText.length > 50) {
                        description = bodyText;
                        console.log('Falling back to body text');
                    }
                } catch (error) {
                    console.log('Could not get body text');
                }
            }

            if (!description || description.length < 50) {
                console.log('No meaningful description found');
                return 'Full description not available.';
            }

            return description;
        } catch (error) {
            console.error(`Error fetching job description from ${jobUrl}:`, error);
            return 'Error fetching full description.';
        }
    }

    // Method to extract skills from the job description (using OpenAI)
    async extractSkillsFromDescription(description) {
        try {
            // This uses OpenAI to extract skills from the text description
            const prompt = `Extract the key technical skills and requirements from this job description. Return only a comma-separated list of skills:\n\n${description}\n\nSkills:`;

            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo", // or a more capable model if needed
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3, // Lower temperature for more focused extraction
                max_tokens: 150 // Limit the response length
            });

            const skillsText = response.choices[0].message.content.trim();
            // Split by comma and trim whitespace, filter out empty strings
            return skillsText.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);

        } catch (error) {
            console.error('Error extracting skills with OpenAI:', error);
            return []; // Return empty array on error
        }
    }

    async analyzeJobMatch(job) {
        try {
            // Get similar jobs from vector DB for comparison
            const similarJobs = await this.pineconeService.querySimilar(job.description, 5);
            
            // Calculate similarity scores
            const similarityScores = similarJobs.map(similarJob => ({
                title: similarJob.metadata.title,
                company: similarJob.metadata.company,
                score: similarJob.score
            }));

            const prompt = `Analyze this job and provide a match analysis based on the job details and similar positions:

            Job Details:
            Title: ${job.title}
            Company: ${job.company}
            Description: ${job.description}
            Location: ${job.location}
            Salary: ${job.salary}
            Job Type: ${job.jobType}

            Similar Jobs Found:
            ${similarJobs.map(job => `- ${job.metadata.title} at ${job.metadata.company} (Similarity: ${(job.score * 100).toFixed(1)}%)`).join('\n')}

            Please provide:
            1. Overall Match Score (0-100)
            2. Key Strengths for this Role
            3. Potential Challenges
            4. Required Skills Gap Analysis
            5. Career Growth Potential
            6. Market Position
            7. Recommendations for Application

            Format the response in clear sections with bullet points.`;

            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            });

            return {
                analysis: response.choices[0].message.content,
                similarityScores
            };
        } catch (error) {
            console.error('Error analyzing job match:', error);
            return {
                analysis: 'Unable to analyze job match',
                similarityScores: []
            };
        }
    }

    async getJobInsights(job) {
        try {
            // Check if we have enough data to generate insights
            if (!job.description || job.description === 'Full description not available.' || job.description === 'Error fetching full description.') {
                return 'Unable to generate insights: No job description available.';
            }

            console.log('Generating insights for job:', job.title);

            // Prepare the job data for analysis
            const jobData = {
                title: job.title,
                company: job.company,
                location: job.location,
                salary: job.salary,
                jobType: job.jobType,
                postedDate: job.postedDate,
                description: job.description
            };

            // Get similar jobs from vector DB for context
            let similarJobsContext = '';
            try {
                const similarJobs = await this.pineconeService.querySimilarJobs(job.description, 5);
                if (similarJobs && similarJobs.length > 0) {
                    similarJobsContext = similarJobs.map(similarJob => `
                        Title: ${similarJob.title}
                        Company: ${similarJob.company}
                        Location: ${similarJob.location}
                        Salary: ${similarJob.salary}
                        Job Type: ${similarJob.jobType}
                        Description: ${similarJob.description}
                    `).join('\n\n');
                }
            } catch (error) {
                console.log('Could not fetch similar jobs, proceeding without context');
            }

            const prompt = `As a job market analyst, analyze this job listing and provide comprehensive insights:

            Current Job Details:
            Title: ${jobData.title}
            Company: ${jobData.company}
            Location: ${jobData.location}
            Salary: ${jobData.salary}
            Job Type: ${jobData.jobType}
            Posted Date: ${jobData.postedDate}
            Description: ${jobData.description}

            ${similarJobsContext ? `Context from Similar Jobs:\n${similarJobsContext}` : ''}

            Please provide a detailed analysis in the following format:

            1. Market Overview
            - Current demand trends for this role
            - Salary ranges and compensation patterns
            - Common job types and work arrangements
            - Industry distribution

            2. Required Skills Analysis
            - Most common technical skills
            - Required experience levels
            - Emerging technologies
            - Soft skills and qualifications

            3. Company Insights
            - Industry distribution
            - Company size patterns
            - Work culture indicators
            - Growth opportunities

            4. Career Opportunities
            - Growth potential
            - Career paths
            - Required qualifications
            - Professional development

            5. Market Trends
            - Industry trends
            - Demand for this role
            - Competitive position
            - Future outlook

            Format each section with clear bullet points and specific details.`;

            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a job market analyst with expertise in technology roles. Provide detailed, actionable insights about job listings. Focus on technical skills, market trends, and career opportunities. Always provide insights even if the job description is limited."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            });

            const insights = response.choices[0].message.content;
            console.log('Generated insights for job:', job.title);

            // Store the job and insights in Pinecone
            try {
                const jobId = await this.pineconeService.storeJob({
                    ...jobData,
                    insights: insights
                });

                // Verify the storage
                const isStored = await this.pineconeService.verifyStorage(jobId);
                if (isStored) {
                    console.log('Successfully stored job and insights in Pinecone');
                } else {
                    console.error('Failed to verify job storage in Pinecone');
                }

                return insights;
            } catch (error) {
                console.error('Error storing job in Pinecone:', error);
                // Continue without failing
                return insights;
            }
        } catch (error) {
            console.error('Error getting job insights:', error);
            return 'Unable to generate insights: ' + error.message;
        }
    }

    async storeJobInVectorDB(job) {
        try {
            // Generate embedding for the job description
            const embedding = await this.getEmbedding(job.description);
            
            // Prepare the document for Pinecone
            const document = {
                id: job.id,
                values: embedding,
                metadata: {
                    type: 'job_insight',
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    salary: job.salary,
                    postedDate: job.postedDate,
                    description: job.description,
                    url: job.url,
                    source: job.source,
                    jobType: job.jobType,
                    insights: job.insights,
                    timestamp: new Date().toISOString()
                }
            };

            // Store in Pinecone using the service
            await this.pineconeService.upsert(document);
            console.log(`Successfully stored job ${job.title} in vector DB`);
            return job.id;
        } catch (error) {
            console.error('Error storing job in vector database:', error);
            throw error;
        }
    }

    async getEmbedding(text) {
        try {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: text
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('Error getting embedding:', error);
            throw error;
        }
    }

}

module.exports = JobScraperService; 