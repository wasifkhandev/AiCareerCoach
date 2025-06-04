const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function validateApiKey(apiKey) {
    if (!apiKey) {
        throw new Error('Pinecone API key is missing. Please check your .env file.');
    }
    if (apiKey.length < 20) {
        throw new Error('Invalid Pinecone API key format. Please check your .env file.');
    }
    return true;
}

async function createPineconeIndex() {
    try {
        console.log('Validating Pinecone API key...');
        await validateApiKey(process.env.PINECONE_API_KEY);
        
        console.log('Initializing Pinecone...');
        const pinecone = new Pinecone({ 
            apiKey: process.env.PINECONE_API_KEY,
            environment: 'gcp-starter' // Add environment for free tier
        });

        // Define the new index name
        const newIndexName = process.env.PINECONE_INDEX || 'career-analytics';
        const dimension = 1536; // OpenAI's text-embedding-ada-002 dimension

        console.log(`\nCreating new index: ${newIndexName}`);
        console.log(`Dimension: ${dimension}`);
        console.log(`Environment: gcp-starter`);

        // Create the index with gcp-starter region for free plan
        await pinecone.createIndex({
            name: newIndexName,
            dimension: dimension,
            metric: 'cosine', // Best for semantic search
            spec: {
                serverless: {
                    cloud: 'gcp',
                    region: 'gcp-starter'
                }
            }
        });

        console.log('\nWaiting for index to be ready...');
        // Wait for the index to be ready
        let indexReady = false;
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes maximum wait time

        while (!indexReady && attempts < maxAttempts) {
            try {
                const index = pinecone.index(newIndexName);
                const stats = await index.describeIndexStats();
                if (stats.dimension === dimension) {
                    indexReady = true;
                    console.log('Index is ready! ✅');
                    console.log('\nIndex Statistics:');
                    console.log(JSON.stringify(stats, null, 2));
                }
            } catch (error) {
                console.log(`Waiting for index to be ready... (Attempt ${attempts + 1}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between attempts
            }
            attempts++;
        }

        if (!indexReady) {
            throw new Error('Index creation timed out');
        }

        console.log('\nIndex creation completed successfully!');
        console.log('\nPlease update your .env file with:');
        console.log(`PINECONE_INDEX=${newIndexName}`);
        console.log(`PINECONE_ENVIRONMENT=gcp-starter`);

        return true;
    } catch (error) {
        console.error('\nError creating Pinecone index:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        console.error('\nPlease check:');
        console.error('1. Your Pinecone API key is correct and active');
        console.error('2. You have sufficient permissions to create indexes');
        console.error('3. The index name is not already in use');
        console.error('4. You are using the correct environment (gcp-starter for free tier)');
        console.error('\nTo fix this:');
        console.error('1. Go to https://app.pinecone.io/');
        console.error('2. Check your API key in the console');
        console.error('3. Make sure you are on the free tier');
        console.error('4. Update your .env file with the correct API key');
        return false;
    }
}

// Run the index creation
createPineconeIndex().then(success => {
    if (!success) {
        process.exit(1);
    }
}); 