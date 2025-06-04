# AI Career Coach

An intelligent career coaching platform that leverages AI to provide personalized career guidance and insights.

## Features

- AI-powered career insights and recommendations
- Personalized career path analysis
- Skill gap identification
- Job market trend analysis
- Interactive career planning tools

## Tech Stack

- Node.js
- Express.js
- OpenAI API
- Pinecone Vector Database
- React.js (Frontend)
- MongoDB (Database)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB
- Pinecone account
- OpenAI API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=your_mongodb_uri

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_pinecone_index
PINECONE_ENVIRONMENT=your_pinecone_environment
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/wasifkhandev/AiCareerCoach.git
cd AiCareerCoach
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
AiCareerCoach/
├── client/                 # Frontend React application
├── server/                 # Backend Express application
├── services/              # Core services
│   ├── openai_service.js  # OpenAI integration
│   └── pinecone_service.js # Pinecone vector store
├── scripts/               # Utility scripts
├── tests/                 # Test files
└── docs/                  # Documentation
```

## API Documentation

### Career Insights API

- `POST /api/insights` - Generate career insights
- `GET /api/insights/:id` - Get specific insight
- `GET /api/insights` - List all insights

### Career Path API

- `POST /api/career-path` - Generate career path
- `GET /api/career-path/:id` - Get specific career path
- `PUT /api/career-path/:id` - Update career path

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Wasif Khan - [@wasifkhandev](https://github.com/wasifkhandev)

Project Link: [https://github.com/wasifkhandev/AiCareerCoach](https://github.com/wasifkhandev/AiCareerCoach) 