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
