import { BrowserRouter } from "react-router-dom";

// ---- Providers ----
import { LanguageProvider } from "@app/providers/LanguageProvider";
import { ThemeProvider } from "@app/providers/ThemeProvider";
import { AuthProvider } from "@app/providers/AuthProvider";
import { QueryProvider } from "@app/providers/QueryProvider";
import { StoreProvider } from "@app/providers/StoreProvider";
import { ToasterProvider } from "@shared/components/Toaster";

// ---- Router ----
import { AppRouter } from "@app/router";

// ---- Shared Components ----
import { ErrorBoundary } from "@shared/components/ErrorBoundary";
import { Toaster } from "@shared/components/Toaster";

/**
 * App — Store Dashboard Application Root
 *
 * Provider Nesting Order (outermost → innermost):
 * 1. ErrorBoundary     — Catch unhandled errors anywhere in the tree
 * 2. LanguageProvider  — i18n for dual language support
 * 3. QueryProvider     — React Query for server state management
 * 4. AuthProvider      — Authentication state (loaded before store)
 * 5. StoreProvider     — Store context (needs AuthProvider for useAuth)
 * 6. ThemeProvider     — Dark/Light mode
 * 7. ToasterProvider   — Toast notification system
 * 8. BrowserRouter     — Client-side routing
 */
export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <QueryProvider>
          <AuthProvider>
            <StoreProvider>
              <ThemeProvider>
                <ToasterProvider>
                  <BrowserRouter>
                    <Toaster />
                    <AppRouter />
                  </BrowserRouter>
                </ToasterProvider>
              </ThemeProvider>
            </StoreProvider>
          </AuthProvider>
        </QueryProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
