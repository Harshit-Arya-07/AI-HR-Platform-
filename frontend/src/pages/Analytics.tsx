import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Analytics: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Analytics
        </Typography>
        <Typography>
          Analytics dashboard will be displayed here.
        </Typography>
      </Box>
    </Container>
  );
};

export default Analytics;