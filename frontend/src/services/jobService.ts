import { api } from './authService';

export interface Job {
  _id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
  status: 'active' | 'paused' | 'closed';
  candidateCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobData {
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
}

export interface JobsResponse {
  jobs: Job[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

class JobService {
  // Get all jobs
  async getJobs(filters?: {
    status?: string;
    limit?: number;
    skip?: number;
  }): Promise<JobsResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/api/jobs?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch jobs');
    }
  }

  // Get job by ID
  async getJobById(id: string): Promise<Job> {
    try {
      const response = await api.get(`/api/jobs/${id}`);
      return response.data.job;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch job');
    }
  }

  // Create new job
  async createJob(data: CreateJobData): Promise<{ message: string; job: Job }> {
    try {
      const response = await api.post('/api/jobs', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create job');
    }
  }

  // Update job
  async updateJob(id: string, data: Partial<CreateJobData>): Promise<{ message: string; job: Job }> {
    try {
      const response = await api.patch(`/api/jobs/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update job');
    }
  }

  // Delete job
  async deleteJob(id: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/api/jobs/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete job');
    }
  }
}

export const jobService = new JobService();