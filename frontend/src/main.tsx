import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/index.css";
import App from './app/App.tsx'
import { BrowserRouter } from 'react-router-dom';
import { ColorModeProvider } from "./styles/ColorModeProvider";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorModeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ColorModeProvider>
  </StrictMode>
)
