import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

const rootEl = document.getElementById('root')!;

function showLoadError(message: string) {
  rootEl.innerHTML = `
    <div style="min-height:100vh;background:#001B44;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">⚠️</div>
      <h1 style="font-size:22px;margin-bottom:12px">No se pudo cargar la app</h1>
      <pre style="background:rgba(0,0,0,0.4);padding:16px;border-radius:12px;font-size:12px;overflow:auto;max-width:100%;max-height:180px;white-space:pre-wrap;word-break:break-all">${String(message).replace(/</g, '&lt;')}</pre>
      <button onclick="window.location.reload()" style="margin-top:20px;padding:12px 24px;background:#2563eb;color:white;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer">Recargar</button>
    </div>
  `;
}

async function init() {
  try {
    const [{ default: App }] = await Promise.all([
      import('./App.tsx'),
    ]);
    createRoot(rootEl).render(
      <StrictMode>
        <ThemeProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ThemeProvider>
      </StrictMode>
    );
  } catch (err) {
    console.error('Init error:', err);
    const message = err instanceof Error ? err.message + '\n\n' + (err.stack || '') : String(err);
    showLoadError(message);
  }
}

init();
