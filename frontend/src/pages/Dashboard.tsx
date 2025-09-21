import React from 'react';
import { Container, Typography, Grid, Card, CardContent, Box } from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ flexGrow: 1, py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Candidates</Typography>
                <Typography variant="h4" color="primary">156</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Active Jobs</Typography>
                <Typography variant="h4" color="primary">8</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Strong Matches</Typography>
                <Typography variant="h4" color="primary">42</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Avg Score</Typography>
                <Typography variant="h4" color="primary">7.2</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                Welcome to the AI HR Platform dashboard. This is where you'll see 
                real-time analytics, candidate pipeline updates, and system insights.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;