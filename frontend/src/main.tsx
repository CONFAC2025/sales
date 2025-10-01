import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import theme from './theme';
import App from './App';
import './index.css';

import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import { NotificationProvider } from './contexts/NotificationContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteSettingsProvider>
          <NotificationProvider>
            <ChatProvider>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <App />
              </ThemeProvider>
            </ChatProvider>
          </NotificationProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
