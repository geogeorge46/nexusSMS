import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './index.css'
import { TooltipProvider } from './components/ui/tooltip'
import { NotificationProvider } from './providers/notification-provider'
import { AppQueryProvider } from './providers/query-provider'
import { ThemeProvider } from './providers/theme-provider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AppQueryProvider>
        <NotificationProvider>
          <TooltipProvider delayDuration={120}>
            <App />
          </TooltipProvider>
        </NotificationProvider>
      </AppQueryProvider>
    </ThemeProvider>
  </StrictMode>,
)
