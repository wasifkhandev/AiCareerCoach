const PineconeService = require('../services/pinecone_service');
require('dotenv').config();

async function testPineconeService() {
    console.log('Testing Pinecone Service...\n');
    const pineconeService = new PineconeService();
    let testInsightId = null;

    try {
        // 1. Test initialization
        console.log('1. Testing initialization...');
        await pineconeService.initialize();
        console.log('✓ Pinecone initialization successful\n');

        // 2. Test insight storage
        console.log('2. Testing insight storage...');
        const testInsight = {
            title: 'Career Development Insight',
            content: 'This is a test insight about career development. It contains information about professional growth and skill development.',
            category: 'career-development'
        };

        testInsightId = await pineconeService.storeInsight(testInsight);
        console.log('✓ Insight storage successful\n');

        // 3. Test insight retrieval
        console.log('3. Testing insight retrieval...');
        const retrievedInsight = await pineconeService.getInsight(testInsightId);
        if (retrievedInsight && retrievedInsight.title === testInsight.title) {
            console.log('✓ Insight retrieval successful\n');
        } else {
            throw new Error('Retrieved insight does not match stored insight');
        }

        // 4. Test similarity search
        console.log('4. Testing similarity search...');
        const searchResults = await pineconeService.querySimilarInsights(
            'career development and professional growth',
            { category: 'career-development' }
        );

        if (searchResults && searchResults.length > 0) {
            console.log('✓ Similarity search successful\n');
        } else {
            throw new Error('No similar insights found');
        }

        console.log('All tests completed successfully! ');

    } catch (error) {
        console.error('\n Error during testing:', error);
        throw error;
    } finally {
        // Clean up test data
        if (testInsightId) {
            try {
                await pineconeService.deleteInsight(testInsightId);
                console.log('\nTest data cleaned up successfully');
            } catch (cleanupError) {
                console.error('Error cleaning up test data:', cleanupError);
            }
        }
    }
}

// Run the tests
testPineconeService().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
}); 