import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#A0585A',
      light: '#C4807F',
      dark: '#7A3F41',
      contrastText: '#fff',
    },
    secondary: {
      main: '#1A1A1A',
      contrastText: '#fff',
    },
    background: {
      default: '#F7F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6B6B6B',
    },
    divider: '#EDE8E8',
    error: { main: '#D32F2F' },
    success: { main: '#388E3C' },
    warning: { main: '#F57C00' },
    info: { main: '#0288D1' },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1.1rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.8rem', color: '#6B6B6B' },
    caption: { fontSize: '0.75rem', color: '#9E9E9E' },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
  },
  shape: {
    borderRadius: 4,
  },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.06)',
    '0 1px 4px rgba(0,0,0,0.08)',
    '0 2px 6px rgba(0,0,0,0.08)',
    '0 2px 8px rgba(0,0,0,0.10)',
    '0 4px 12px rgba(0,0,0,0.10)',
    '0 4px 16px rgba(0,0,0,0.12)',
    '0 6px 20px rgba(0,0,0,0.12)',
    '0 8px 24px rgba(0,0,0,0.12)',
    '0 8px 28px rgba(0,0,0,0.14)',
    '0 10px 32px rgba(0,0,0,0.14)',
    '0 10px 36px rgba(0,0,0,0.14)',
    '0 12px 40px rgba(0,0,0,0.16)',
    '0 12px 44px rgba(0,0,0,0.16)',
    '0 14px 48px rgba(0,0,0,0.16)',
    '0 14px 52px rgba(0,0,0,0.18)',
    '0 16px 56px rgba(0,0,0,0.18)',
    '0 16px 60px rgba(0,0,0,0.18)',
    '0 18px 64px rgba(0,0,0,0.20)',
    '0 18px 68px rgba(0,0,0,0.20)',
    '0 20px 72px rgba(0,0,0,0.20)',
    '0 20px 76px rgba(0,0,0,0.22)',
    '0 22px 80px rgba(0,0,0,0.22)',
    '0 22px 84px rgba(0,0,0,0.22)',
    '0 24px 88px rgba(0,0,0,0.24)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F7F5F5',
          fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
        },
        '*::-webkit-scrollbar': { width: '6px', height: '6px' },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': { background: '#DDD', borderRadius: '3px' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 20px',
          fontWeight: 600,
        },
        contained: {
          '&:hover': { filter: 'brightness(0.92)' },
        },
        outlined: {
          borderColor: '#DDD',
          '&:hover': { borderColor: '#A0585A', backgroundColor: '#A0585A08' },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #EDE8E8',
          borderRadius: 6,
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: '20px', '&:last-child': { paddingBottom: '20px' } },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            backgroundColor: '#FFFFFF',
            '& fieldset': { borderColor: '#DDD' },
            '&:hover fieldset': { borderColor: '#A0585A' },
            '&.Mui-focused fieldset': { borderColor: '#A0585A', borderWidth: 1.5 },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#A0585A' },
        },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          borderRadius: 4,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#DDD' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#A0585A' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#A0585A', borderWidth: 1.5 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4, fontWeight: 500, fontSize: '0.75rem' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 6, border: '1px solid #EDE8E8' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '20px 24px 16px',
          borderBottom: '1px solid #EDE8E8',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: '20px 24px' } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '16px 24px', borderTop: '1px solid #EDE8E8' } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#6B6B6B',
          backgroundColor: '#F7F5F5',
          borderBottom: '1px solid #EDE8E8',
        },
        body: {
          fontSize: '0.875rem',
          borderBottom: '1px solid #F0ECEC',
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 44,
          '&.Mui-selected': { color: '#A0585A' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#A0585A', height: 2 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          margin: '1px 8px',
          '&.Mui-selected': {
            backgroundColor: '#A0585A',
            color: '#fff',
            '& .MuiListItemIcon-root': { color: '#fff' },
            '&:hover': { backgroundColor: '#8F4C4E' },
          },
          '&:hover': { backgroundColor: 'rgba(160,88,90,0.08)' },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 38, color: '#9E9E9E' },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#EDE8E8' } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { border: '1px solid #EDE8E8' },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 4 } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.75rem', borderRadius: 4 },
      },
    },
  },
});

export default theme;
