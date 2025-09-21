import React, { useState } from 'react';
import {
  Container, Paper, TextField, Button, Typography, Box, Alert, Link, Grid, MenuItem
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const Login: React.FC = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('hr_manager');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    try {
      if (isRegisterMode) {
        // Validation for registration
        if (password !== confirmPassword) {
          setLocalError('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          setLocalError('Password must be at least 6 characters long');
          return;
        }
        if (name.trim().length < 2) {
          setLocalError('Name must be at least 2 characters long');
          return;
        }
        
        // Register user
        const response = await authService.register({
          name: name.trim(),
          email,
          password,
          company: company.trim() || undefined,
          role
        });
        
        // Auto-login after registration
        localStorage.setItem('token', response.token);
        window.location.reload();
      } else {
        // Login user
        await login(email, password);
      }
    } catch (error: any) {
      console.error(isRegisterMode ? 'Registration failed:' : 'Login failed:', error);
      setLocalError(error.message || (isRegisterMode ? 'Registration failed' : 'Login failed'));
    }
  };
  
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setLocalError('');
    setEmail('');
    setPassword('');
    setName('');
    setCompany('');
    setConfirmPassword('');
    setRole('hr_manager');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            AI HR Platform
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary" gutterBottom>
            {isRegisterMode ? 'Create your account' : 'Sign in to your account'}
          </Typography>
          
          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {localError || error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {isRegisterMode && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                autoFocus={isRegisterMode}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus={!isRegisterMode}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            {isRegisterMode && (
              <>
                <TextField
                  margin="normal"
                  fullWidth
                  id="company"
                  label="Company (Optional)"
                  name="company"
                  autoComplete="organization"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="role"
                  label="Role"
                  name="role"
                  select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <MenuItem value="hr_manager">HR Manager</MenuItem>
                  <MenuItem value="recruiter">Recruiter</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField>
              </>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            {isRegisterMode && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (isRegisterMode ? 'Creating Account...' : 'Signing In...') : (isRegisterMode ? 'Create Account' : 'Sign In')}
            </Button>
            
            <Grid container justifyContent="center">
              <Grid item>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={toggleMode}
                  sx={{ textDecoration: 'none' }}
                >
                  {isRegisterMode 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"
                  }
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;