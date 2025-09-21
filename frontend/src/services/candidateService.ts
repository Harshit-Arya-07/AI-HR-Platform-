import { api } from './authService';

export interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  resumeText: string;
  jobId: string;
  overallScore: number;
  scoreBreakdown: {
    skillOverlap: number;
    semanticSimilarity: number;
    roleRelevance: number;
    seniorityMatch: number;
  };
  extractedSkills: string[];
  missingSkills: string[];
  aiSummary: string;
  recommendation: 'STRONG_MATCH' | 'GOOD_MATCH' | 'AVERAGE_MATCH' | 'WEAK_MATCH';
  confidence: number;
  interviewQuestions: string[];
  status: 'new' | 'reviewed' | 'interviewing' | 'hired' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateData {
  resumeText: string;
  jobId: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface CandidatesResponse {
  candidates: Candidate[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

class CandidateService {
  // Extract text from PDF file
  async extractPDFText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // For now, we'll use a simple text extraction
          // In a real implementation, you'd use a PDF parsing library like pdf-lib or PDF.js
          const text = e.target?.result as string;
          
          // Simple text extraction - in production, use proper PDF parsing
          if (file.type === 'application/pdf') {
            // This is a placeholder - in reality you'd need PDF.js or similar
            reject(new Error('PDF parsing requires additional setup. Please copy and paste resume text for now.'));
          } else {
            // Handle text files
            resolve(text);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  // Create candidate with resume processing
  async createCandidate(data: CreateCandidateData): Promise<{ message: string; candidate: Candidate }> {
    try {
      const response = await api.post('/api/candidates', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create candidate');
    }
  }

  // Upload resume file and create candidate
  async uploadResume(file: File, jobId: string, candidateInfo?: { name?: string; email?: string; phone?: string }): Promise<{ message: string; candidate: Candidate }> {
    try {
      const resumeText = await this.extractPDFText(file);
      
      return await this.createCandidate({
        resumeText,
        jobId,
        ...candidateInfo
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload resume');
    }
  }

  // Get all candidates with filters
  async getCandidates(filters?: {
    jobId?: string;
    status?: string;
    minScore?: number;
    maxScore?: number;
    limit?: number;
    skip?: number;
  }): Promise<CandidatesResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/api/candidates?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch candidates');
    }
  }

  // Update candidate status
  async updateCandidateStatus(id: string, status: string, notes?: string): Promise<{ message: string; candidate: Candidate }> {
    try {
      const response = await api.patch(`/api/candidates/${id}/status`, { status, notes });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update candidate status');
    }
  }
}

export const candidateService = new CandidateService();