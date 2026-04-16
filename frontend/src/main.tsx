import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "@/App";
import { AuthProvider } from "@/auth/AuthContext";
import { RouteProvider } from "@/providers/route-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@/styles/globals.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const appBasePath = import.meta.env.VITE_APP_BASE_PATH || "/efor-sarayi";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter basename={appBasePath}>
        <RouteProvider>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </RouteProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
