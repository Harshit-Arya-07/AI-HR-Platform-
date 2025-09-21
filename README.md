# AI-Powered HR Automation Platform

A comprehensive full-stack solution that extends resume screening into a complete HR automation platform with AI-driven candidate evaluation, interview question generation, and analytics dashboard.

## 🚀 Features

### Core Functionality
- **Resume Screening & Scoring**: PDF/text resume parsing with ML-powered scoring against job descriptions
- **Automated Interview Questions**: AI-generated tailored interview questions based on candidate profiles
- **ATS Integration**: REST API endpoints for seamless integration with Applicant Tracking Systems
- **HR Analytics Dashboard**: Real-time analytics and candidate management interface
- **Feedback Loop**: Recruiter feedback integration for continuous model improvement

### Scoring Algorithm
- **Skill Overlap**: Direct skill matching between resume and job requirements
- **Semantic Similarity**: TF-IDF and embedding-based content analysis
- **Role Relevance**: Experience alignment with job responsibilities
- **Seniority Assessment**: Years of experience and career progression analysis

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │ Node.js Backend │    │  Python ML API  │
│   (Port 3000)   │◄──►│   (Port 5000)   │◄──►│   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │    MongoDB      │
                       │   (Port 27017)  │
                       └─────────────────┘
```

## 📁 Project Structure

```
ai-hr-platform/
├── ml-service/                 # Python ML service (FastAPI + scikit-learn)
│   ├── app/
│   │   ├── models/            # ML models and pipelines
│   │   ├── services/          # Business logic
│   │   ├── routers/           # API endpoints
│   │   └── utils/             # Utility functions
│   ├── tests/                 # ML service tests
│   ├── requirements.txt
│   └── Dockerfile
├── backend/                   # Node.js backend (Express + MongoDB)
│   ├── src/
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── middleware/        # Auth, logging, etc.
│   ├── tests/                 # Backend tests
│   ├── package.json
│   └── Dockerfile
├── frontend/                  # React dashboard
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API clients
│   │   └── utils/             # Utility functions
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docker/                    # Docker configuration
│   └── docker-compose.yml
├── infra/                     # AWS deployment scripts
│   ├── cloudformation/        # Infrastructure as Code
│   ├── scripts/               # Deployment scripts
│   └── docs/                  # Deployment guides
├── tests/                     # Integration tests
└── .github/                   # CI/CD workflows
    └── workflows/
```

## 🛠️ Technology Stack

### Backend Services
- **Python ML Service**: FastAPI, scikit-learn, spaCy, PyPDF2
- **Node.js Backend**: Express.js, MongoDB, Mongoose, JWT
- **Database**: MongoDB (development) / MongoDB Atlas (production)

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Components**: Material-UI, Recharts for analytics
- **State Management**: React Context + useReducer
- **HTTP Client**: Axios

### DevOps & Deployment
- **Containerization**: Docker, Docker Compose
- **Cloud**: AWS ECS Fargate, ECR, S3, CloudWatch
- **CI/CD**: GitHub Actions
- **Monitoring**: AWS CloudWatch, custom metrics

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Python 3.9+
- MongoDB (for local development)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-hr-platform
   ```

2. **Environment Setup**
   ```bash
   # Copy environment files
   cp ml-service/.env.example ml-service/.env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - ML Service: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Setup (Development)

1. **ML Service**
   ```bash
   cd ml-service
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Backend Service**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📊 API Documentation

### ML Service Endpoints
- `POST /score` - Score resume against job description
- `POST /parse-resume` - Extract structured data from resume
- `POST /generate-questions` - Generate interview questions
- `GET /health` - Health check

### Backend Endpoints
- `POST /api/candidates` - Create candidate profile
- `GET /api/candidates` - List candidates with filtering
- `POST /api/jobs` - Create job posting
- `GET /api/analytics` - Get recruitment analytics
- `POST /api/auth/login` - User authentication

### Example API Request/Response

**Resume Scoring Request:**
```json
{
  "resume_text": "John Doe, Software Engineer with 5 years...",
  "job_description": "We are looking for a Senior Python Developer...",
  "job_requirements": ["Python", "Django", "AWS", "Docker"]
}
```

**Resume Scoring Response:**
```json
{
  "candidate_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "overall_score": 8.5,
  "score_breakdown": {
    "skill_overlap": 0.85,
    "semantic_similarity": 0.82,
    "role_relevance": 0.88,
    "seniority_match": 0.87
  },
  "extracted_skills": ["Python", "Django", "JavaScript", "React"],
  "missing_skills": ["AWS", "Docker"],
  "summary": "Strong candidate with relevant backend experience...",
  "interview_questions": [
    "Can you describe your experience with Python web frameworks?",
    "How would you approach deploying a Django application to the cloud?"
  ],
  "recommendation": "STRONG_MATCH"
}
```

## 🧪 Testing

### Run All Tests
```bash
# Unit tests
cd ml-service && python -m pytest tests/
cd backend && npm test
cd frontend && npm test

# Integration tests
cd tests && python -m pytest integration/
```

### Test Coverage
- ML Service: Unit tests for scoring algorithms and data processing
- Backend: API endpoint tests and database operations
- Frontend: Component tests and user interaction flows
- Integration: End-to-end workflow tests

## 🚢 Deployment

### AWS ECS Fargate Deployment

1. **Build and Push Images**
   ```bash
   ./infra/scripts/build-and-push.sh
   ```

2. **Deploy Infrastructure**
   ```bash
   cd infra/cloudformation
   aws cloudformation deploy --template-file main.yml --stack-name hr-platform
   ```

3. **Deploy Services**
   ```bash
   ./infra/scripts/deploy-services.sh production
   ```

### Environment Variables

**ML Service (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/hr_platform
MODEL_PATH=/app/models
LOG_LEVEL=INFO
```

**Backend (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/hr_platform
JWT_SECRET=your-jwt-secret
ML_SERVICE_URL=http://ml-service:8000
NODE_ENV=development
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

## 🔒 Security

- JWT-based authentication for HR users
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure file upload handling
- Environment variable management
- HTTPS enforcement in production

## 📈 Monitoring & Logging

- **Application Metrics**: Custom metrics for scoring accuracy, API response times
- **Health Checks**: Kubernetes-style health endpoints
- **Logging**: Structured logging with correlation IDs
- **Alerting**: CloudWatch alarms for critical metrics
- **Performance**: APM integration for service monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For questions and support:
- Create an issue in the GitHub repository
- Check the [documentation](./docs/)
- Review the [deployment guide](./infra/docs/deployment.md)

## 🗺️ Roadmap

- [ ] Advanced ML models (transformer-based embeddings)
- [ ] Multi-language resume support
- [ ] Video interview analysis
- [ ] Advanced analytics and reporting
- [ ] Mobile application
- [ ] Third-party ATS integrations (Workday, BambooHR)