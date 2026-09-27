import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { DepartmentProvider } from './context/DepartmentContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <DepartmentProvider>
          <App />
        </DepartmentProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
