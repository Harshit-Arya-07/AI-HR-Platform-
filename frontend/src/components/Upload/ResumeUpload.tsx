import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { candidateService } from '../../services/candidateService';
import { Job } from '../../services/jobService';

interface ResumeUploadProps {
  jobs: Job[];
  onUploadSuccess?: (candidate: any) => void;
  onError?: (error: string) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ jobs, onUploadSuccess, onError }) => {
  const [selectedJob, setSelectedJob] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [showManualDialog, setShowManualDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
      onError?.('Please upload a PDF, Word document, or text file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      onError?.('File size must be less than 10MB.');
      return;
    }

    setSelectedFile(file);
    setUseManualInput(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedJob) {
      onError?.('Please select a job position.');
      return;
    }

    if (!selectedFile && !manualText.trim()) {
      onError?.('Please upload a resume file or enter resume text.');
      return;
    }

    setUploading(true);

    try {
      let result;

      if (useManualInput && manualText.trim()) {
        // Use manual text input
        result = await candidateService.createCandidate({
          resumeText: manualText.trim(),
          jobId: selectedJob,
          name: candidateInfo.name || undefined,
          email: candidateInfo.email || undefined,
          phone: candidateInfo.phone || undefined,
        });
      } else if (selectedFile) {
        // Use file upload
        result = await candidateService.uploadResume(
          selectedFile,
          selectedJob,
          {
            name: candidateInfo.name || undefined,
            email: candidateInfo.email || undefined,
            phone: candidateInfo.phone || undefined,
          }
        );
      } else {
        throw new Error('No resume data provided');
      }

      onUploadSuccess?.(result.candidate);
      
      // Reset form
      setSelectedFile(null);
      setManualText('');
      setSelectedJob('');
      setCandidateInfo({ name: '', email: '', phone: '' });
      setUseManualInput(false);
      setShowManualDialog(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setUploading(false);
    }
  };

  const selectedJobObj = jobs.find(job => job._id === selectedJob);

  return (
    <Box>
      {/* Job Selection */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Job Position</InputLabel>
        <Select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          label="Select Job Position"
        >
          {jobs.map((job) => (
            <MenuItem key={job._id} value={job._id}>
              {job.title} - {job.company}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Upload Methods */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant={!useManualInput ? 'contained' : 'outlined'}
          onClick={() => setUseManualInput(false)}
        >
          Upload File
        </Button>
        <Button
          variant={useManualInput ? 'contained' : 'outlined'}
          onClick={() => setUseManualInput(true)}
        >
          Paste Text
        </Button>
      </Box>

      {/* File Upload Area */}
      {!useManualInput && (
        <Paper
          sx={{
            border: 2,
            borderColor: dragOver ? 'primary.main' : 'grey.300',
            borderStyle: 'dashed',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: dragOver ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            mb: 3
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          
          {selectedFile ? (
            <Box>
              <DocumentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                Remove File
              </Button>
            </Box>
          ) : (
            <Box>
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag & Drop Resume Here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to browse files
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports PDF, Word, and Text files (max 10MB)
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Manual Text Input */}
      {useManualInput && (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={10}
            label="Paste Resume Text Here"
            placeholder="Copy and paste the resume content here..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            variant="outlined"
          />
        </Box>
      )}

      {/* Candidate Information (Optional) */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Candidate Information (Optional)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This information will be extracted automatically if not provided.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Full Name"
            value={candidateInfo.name}
            onChange={(e) => setCandidateInfo({ ...candidateInfo, name: e.target.value })}
            sx={{ flex: '1 1 200px' }}
          />
          <TextField
            label="Email"
            type="email"
            value={candidateInfo.email}
            onChange={(e) => setCandidateInfo({ ...candidateInfo, email: e.target.value })}
            sx={{ flex: '1 1 200px' }}
          />
          <TextField
            label="Phone"
            value={candidateInfo.phone}
            onChange={(e) => setCandidateInfo({ ...candidateInfo, phone: e.target.value })}
            sx={{ flex: '1 1 200px' }}
          />
        </Box>
      </Paper>

      {/* Selected Job Info */}
      {selectedJobObj && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Selected Position:</strong> {selectedJobObj.title} at {selectedJobObj.company}
          </Typography>
          {selectedJobObj.requirements.length > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Key Requirements:</strong> {selectedJobObj.requirements.slice(0, 5).join(', ')}
              {selectedJobObj.requirements.length > 5 && '...'}
            </Typography>
          )}
        </Alert>
      )}

      {/* Upload Button */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleUpload}
        disabled={uploading || !selectedJob || (!selectedFile && !manualText.trim())}
        startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
      >
        {uploading ? 'Processing Resume...' : 'Upload & Analyze Resume'}
      </Button>

      {/* PDF Warning */}
      <Alert severity="warning" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Note:</strong> PDF parsing is currently limited. For best results, copy and paste the resume text 
          using the "Paste Text" option, or upload a .txt file.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ResumeUpload;