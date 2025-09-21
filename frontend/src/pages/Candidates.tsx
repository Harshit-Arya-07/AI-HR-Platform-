import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Fab,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Star as StarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import ResumeUpload from '../components/Upload/ResumeUpload';
import { candidateService, Candidate } from '../services/candidateService';
import { jobService, Job } from '../services/jobService';

const Candidates: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [candidatesResponse, jobsResponse] = await Promise.all([
        candidateService.getCandidates({ limit: 50 }),
        jobService.getJobs({ status: 'active', limit: 100 })
      ]);
      
      setCandidates(candidatesResponse.candidates);
      setJobs(jobsResponse.jobs);
    } catch (error: any) {
      setError(error.message || 'Failed to load data');
      toast.error('Failed to load candidates and jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (candidate: Candidate) => {
    setCandidates(prev => [candidate, ...prev]);
    setShowUploadDialog(false);
    toast.success(`Resume processed! Score: ${candidate.overallScore}/10`);
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'STRONG_MATCH': return 'success';
      case 'GOOD_MATCH': return 'info';
      case 'AVERAGE_MATCH': return 'warning';
      default: return 'error';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading candidates...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Candidates
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and review candidate applications with AI-powered scoring
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowUploadDialog(true)}
            size="large"
          >
            Upload Resume
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* No Jobs Warning */}
        {jobs.length === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              No active job postings found. Please create a job posting first to upload resumes.
            </Typography>
          </Alert>
        )}

        {/* Candidates Grid */}
        {candidates.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <CardContent>
              <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No Candidates Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Upload your first resume to get started with AI-powered candidate screening
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowUploadDialog(true)}
                disabled={jobs.length === 0}
              >
                Upload Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {candidates.map((candidate) => {
              const job = jobs.find(j => j._id === candidate.jobId);
              return (
                <Grid item xs={12} md={6} lg={4} key={candidate._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" noWrap>
                            {candidate.name || 'Unnamed Candidate'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {job?.title || 'Unknown Position'}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${candidate.overallScore}/10`}
                          color={getScoreColor(candidate.overallScore) as any}
                          size="small"
                        />
                      </Box>

                      {/* Score Breakdown */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Score Breakdown:
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ minWidth: 80 }}>Skills:</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={candidate.scoreBreakdown.skillOverlap * 100}
                              sx={{ flex: 1, height: 4 }}
                            />
                            <Typography variant="caption">
                              {(candidate.scoreBreakdown.skillOverlap * 10).toFixed(1)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ minWidth: 80 }}>Relevance:</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={candidate.scoreBreakdown.roleRelevance * 100}
                              sx={{ flex: 1, height: 4 }}
                            />
                            <Typography variant="caption">
                              {(candidate.scoreBreakdown.roleRelevance * 10).toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Recommendation */}
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={candidate.recommendation.replace('_', ' ')}
                          color={getRecommendationColor(candidate.recommendation) as any}
                          size="small"
                          icon={<StarIcon />}
                        />
                      </Box>

                      {/* Contact Info */}
                      {(candidate.email || candidate.phone) && (
                        <Box sx={{ mb: 2 }}>
                          {candidate.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" noWrap>
                                {candidate.email}
                              </Typography>
                            </Box>
                          )}
                          {candidate.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption">
                                {candidate.phone}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Skills Preview */}
                      {candidate.extractedSkills.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            Skills: {candidate.extractedSkills.slice(0, 3).join(', ')}
                            {candidate.extractedSkills.length > 3 && ` +${candidate.extractedSkills.length - 3} more`}
                          </Typography>
                        </Box>
                      )}

                      {/* AI Summary */}
                      <Typography variant="body2" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {candidate.aiSummary}
                      </Typography>
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button variant="outlined" fullWidth size="small">
                        View Details
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Upload Dialog */}
        <Dialog
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Upload Resume
              <IconButton onClick={() => setShowUploadDialog(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <ResumeUpload
              jobs={jobs}
              onUploadSuccess={handleUploadSuccess}
              onError={handleUploadError}
            />
          </DialogContent>
        </Dialog>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="upload resume"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => setShowUploadDialog(true)}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Container>
  );
};

export default Candidates;
