const PineconeService = require('../services/pinecone_service');
require('dotenv').config();

async function verifyPineconeConfig() {
    try {
        console.log('Verifying Pinecone configuration...');
        console.log('Index:', process.env.PINECONE_INDEX);
        console.log('API Key length:', process.env.PINECONE_API_KEY?.length || 0);

        const pineconeService = new PineconeService();
        
        console.log('\nInitializing Pinecone...');
        await pineconeService.initialize();
        console.log('Pinecone initialized successfully');

        console.log('\nTesting index connection...');
        // Create a test analytics entry
        const testAnalytics = {
            title: 'Test Job Analytics',
            content: 'This is a test analytics entry to verify Pinecone functionality.',
            category: 'market_analysis',
            type: 'job_analytics',
            company: 'Test Company',
            location: 'Test Location',
            salary: 'Test Salary',
            jobType: 'Test Type',
            insights: 'Test insights about the job market and career opportunities.'
        };

        console.log('\nStoring test analytics...');
        const analyticsId = await pineconeService.storeInsight(testAnalytics);
        console.log('Test analytics stored successfully');

        console.log('\nRetrieving test analytics...');
        const retrievedAnalytics = await pineconeService.getInsight(analyticsId);
        console.log('Retrieved analytics:', JSON.stringify(retrievedAnalytics, null, 2));
        console.log('Original analytics:', JSON.stringify(testAnalytics, null, 2));
        
        if (retrievedAnalytics && retrievedAnalytics.title === testAnalytics.title) {
            console.log('Test analytics retrieved successfully');
        } else {
            throw new Error('Retrieved analytics does not match stored analytics');
        }

        console.log('\nTesting similarity search...');
        const searchResults = await pineconeService.querySimilarInsights(
            'test analytics verification',
            { type: 'job_analytics', category: 'market_analysis' }
        );
        if (searchResults && searchResults.length > 0) {
            console.log('Similarity search successful');
            console.log('Found matches:', searchResults.length);
        } else {
            throw new Error('No similar analytics found');
        }

        console.log('\nCleaning up test data...');
        await pineconeService.deleteInsight(analyticsId);
        console.log('Test data cleaned up successfully');

        console.log('\nPinecone configuration is valid! ✅');
        return true;
    } catch (error) {
        console.error('\nError verifying Pinecone configuration:', error);
        console.error('\nPlease check:');
        console.error('1. Your Pinecone API key is correct');
        console.error('2. Your index name exists in your Pinecone project');
        console.error('3. Your Pinecone project is active');
        console.error('4. Vector dimensions match (should be 1536)');
        return false;
    }
}

// Run the verification
verifyPineconeConfig().then(success => {
    if (!success) {
        process.exit(1);
    }
}); 