import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { jobService, Job, CreateJobData } from '../services/jobService';

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateJobData>({
    title: '',
    company: '',
    description: '',
    requirements: [],
    location: '',
    salaryRange: { min: 0, max: 0 }
  });
  const [requirementsText, setRequirementsText] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.getJobs({ limit: 50 });
      setJobs(response.jobs);
    } catch (error: any) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.company.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const requirements = requirementsText
        .split(',')
        .map(req => req.trim())
        .filter(req => req.length > 0);

      const jobData = {
        ...formData,
        requirements,
        salaryRange: formData.salaryRange?.min && formData.salaryRange?.max ? formData.salaryRange : undefined
      };

      const response = await jobService.createJob(jobData);
      setJobs(prev => [response.job, ...prev]);
      setShowCreateDialog(false);
      resetForm();
      toast.success('Job created successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      description: '',
      requirements: [],
      location: '',
      salaryRange: { min: 0, max: 0 }
    });
    setRequirementsText('');
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography>Loading jobs...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Jobs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage job postings for candidate screening
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
          >
            Create Job
          </Button>
        </Box>

        {jobs.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                No Jobs Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Create your first job posting to start screening candidates
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateDialog(true)}
              >
                Create Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {jobs.map((job) => (
              <Grid item xs={12} key={job._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">{job.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {job.company} {job.location && `• ${job.location}`}
                        </Typography>
                      </Box>
                      <Chip
                        label={job.status.toUpperCase()}
                        color={job.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {job.description}
                    </Typography>
                    
                    {job.requirements.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Requirements:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {job.requirements.map((req, index) => (
                            <Chip key={index} label={req} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      {job.candidateCount} candidates
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create Job Dialog */}
        <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Create New Job
              <IconButton onClick={() => setShowCreateDialog(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company *"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Job Description *"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Requirements (comma-separated)"
                  placeholder="Python, React, AWS, 3+ years experience"
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Job'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Jobs;
