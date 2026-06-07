import { createTheme } from '@mui/material/styles';

const palette = {
  appBackground: '#0b0f17',
  sidebar: '#111722',
  panel: '#161d2a',
  panelRaised: '#1b2332',
  panelSoft: '#121925',
  border: '#293142',
  textPrimary: '#f7f7fb',
  textSecondary: '#a7adbb',
  textMuted: '#7f8798',
  purple: '#7c3aed',
  purpleSoft: '#6d35d1',
  blue: '#42a5ff',
  green: '#66d861',
  orange: '#ff9f32',
  red: '#ff6b7a',
  yellow: '#f7c948',
};

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: palette.purple,
      light: '#9f7aea',
      dark: palette.purpleSoft,
      contrastText: '#ffffff',
    },
    success: {
      main: palette.green,
    },
    warning: {
      main: palette.orange,
    },
    error: {
      main: palette.red,
    },
    background: {
      default: palette.appBackground,
      paper: palette.panel,
    },
    text: {
      primary: palette.textPrimary,
      secondary: palette.textSecondary,
    },
    divider: palette.border,
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      'Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2rem',
      lineHeight: 1.2,
      fontWeight: 800,
      letterSpacing: 0,
    },
    h2: {
      fontSize: '1.65rem',
      lineHeight: 1.25,
      fontWeight: 800,
      letterSpacing: 0,
    },
    h3: {
      fontSize: '1.25rem',
      lineHeight: 1.3,
      fontWeight: 700,
      letterSpacing: 0,
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.55,
      letterSpacing: 0,
    },
    body2: {
      fontSize: '0.86rem',
      lineHeight: 1.45,
      letterSpacing: 0,
    },
    button: {
      fontSize: '0.9rem',
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          minHeight: '100%',
          backgroundColor: palette.appBackground,
        },
        body: {
          minHeight: '100%',
          backgroundColor: palette.appBackground,
        },
        '#root': {
          minHeight: '100vh',
        },
        '*': {
          boxSizing: 'border-box',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 40,
          paddingInline: 18,
          boxShadow: 'none',
        },
        contained: {
          '&.MuiButton-colorPrimary': {
            background: `linear-gradient(135deg, ${palette.purple}, #8b5cf6)`,
            boxShadow: '0 12px 30px rgba(124, 58, 237, 0.35)',
            '&:hover': {
              boxShadow: '0 14px 34px rgba(124, 58, 237, 0.45)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${palette.border}`,
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.22)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${palette.border}`,
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.22)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 48,
          backgroundColor: palette.panel,
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.border,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3a4560',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.purple,
            borderWidth: 1,
          },
        },
        input: {
          fontSize: '0.92rem',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 52,
          borderBottom: `1px solid ${palette.border}`,
        },
        indicator: {
          height: 3,
          borderRadius: 999,
          backgroundColor: palette.purple,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 52,
          paddingInline: 36,
          fontSize: '0.95rem',
          fontWeight: 600,
          letterSpacing: 0,
          textTransform: 'none',
          color: palette.textSecondary,
          '&.Mui-selected': {
            color: '#a985ff',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 52,
          color: palette.textSecondary,
          '&.Mui-selected': {
            color: palette.textPrimary,
            background:
              'linear-gradient(135deg, rgba(124, 58, 237, 0.68), rgba(76, 29, 149, 0.72))',
          },
          '&.Mui-selected:hover': {
            background:
              'linear-gradient(135deg, rgba(124, 58, 237, 0.76), rgba(76, 29, 149, 0.78))',
          },
        },
      },
    },
  },
});

export const themeTokens = palette;
