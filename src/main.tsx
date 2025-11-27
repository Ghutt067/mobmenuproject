import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './contexts/StoreContext.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { SearchProvider } from './contexts/SearchContext.tsx'
import { CartProvider } from './contexts/CartContext.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
          <AuthProvider>
            <SearchProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </SearchProvider>
          </AuthProvider>
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
