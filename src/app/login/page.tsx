'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, CircularProgress, Alert,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem('token')) router.replace('/dashboard');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      router.replace('/dashboard');
    } catch {
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F7F5F5',
      p: 2,
    }}>
      <Box sx={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '10px',
            backgroundColor: '#A0585A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
          }}>
            <AutoAwesomeOutlinedIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 0.5 }}>
            Maneira CRM
          </Typography>
          <Typography variant="body2" sx={{ color: '#9E9E9E' }}>
            Clínica Caroline Maneira
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: '28px !important' }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#1A1A1A' }}>
              Entrar
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '4px' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
                <TextField
                  label="Senha"
                  type={showPass ? 'text' : 'password'}
                  fullWidth
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small">
                            {showPass ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{ mt: 1, py: 1.2, backgroundColor: '#A0585A', '&:hover': { backgroundColor: '#8F4C4E' } }}
                >
                  {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Entrar'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: '#BDBDBD' }}>
          CRBM PR1168 · Biomedicina Estética
        </Typography>
      </Box>
    </Box>
  );
}
