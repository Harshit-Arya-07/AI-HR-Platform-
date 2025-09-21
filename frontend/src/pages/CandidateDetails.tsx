import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const CandidateDetails: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Candidate Details
        </Typography>
        <Typography>
          Detailed candidate information will be displayed here.
        </Typography>
      </Box>
    </Container>
  );
};

export default CandidateDetails;