import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { login as loginService } from '../services/authService';
import { Button, TextField, Container, Typography, Box, Grid, Link } from '@mui/material';

const LoginPage: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Login button clicked");
    e.preventDefault();
    try {
      console.log("Calling loginService...");
      const { token, user } = await loginService({ userId, password });
      console.log("loginService success:", { token, user });
      login(token, user);
      navigate('/');
    } catch (err: any) {
      console.log("loginService error:", err);
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" sx={{ mb: 1 }}>
          분양조직 운영시스템V3
        </Typography>
        <Typography variant="caption" sx={{ mb: 3 }}>
          by ContentsFactory
        </Typography>
        <Typography component="h1" variant="h5">
          로그인
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="userId"
            label="아이디"
            name="userId"
            autoComplete="userId"
            autoFocus
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="비밀번호"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            로그인
          </Button>
          <Grid container justifyContent="space-between">
            <Grid>
              <Typography variant="body2" color="text.secondary">
                가입후 승인되면 로그인 가능합니다
              </Typography>
            </Grid>
            <Grid>
              <Link component={RouterLink} to="/register" variant="body2">
                계정이 없으신가요? 회원가입
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
