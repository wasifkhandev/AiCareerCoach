const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function verifyPineconeConfig() {
    try {
        console.log('Verifying Pinecone configuration...');
        console.log('Environment:', process.env.PINECONE_ENVIRONMENT);
        console.log('Index:', process.env.PINECONE_INDEX);
        console.log('API Key length:', process.env.PINECONE_API_KEY?.length || 0);

        // Initialize Pinecone with the latest client
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY
        });
        
        console.log('\nInitializing Pinecone...');
        
        // Get the index
        const index = pinecone.index(process.env.PINECONE_INDEX);
        console.log('Index retrieved successfully');

        console.log('\nTesting index connection...');
        // Using 1024 dimensions to match the index
        const dummyVector = new Array(1024).fill(0);
        const queryResponse = await index.query({
            vector: dummyVector,
            topK: 1,
            includeMetadata: true
        });
        console.log('Index query successful');

        console.log('\nGetting index statistics...');
        const stats = await index.describeIndexStats();
        console.log('Index statistics:', stats);

        console.log('\nPinecone configuration is valid!');
        return true;
    } catch (error) {
        console.error('\nError verifying Pinecone configuration:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        console.error('\nPlease check:');
        console.error('1. Your Pinecone API key is correct');
        console.error('2. Your index name exists in your Pinecone project');
        console.error('3. Your Pinecone project is active');
        console.error('4. Vector dimensions match (should be 1024)');
        return false;
    }
}

// Run the verification
verifyPineconeConfig().then(success => {
    if (!success) {
        process.exit(1);
    }
}); 