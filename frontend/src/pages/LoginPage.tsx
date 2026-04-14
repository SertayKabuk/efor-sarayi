import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";
import axios from "axios";

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Effort Estimator</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in with your @d-teknoloji.com.tr account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (response) => {
              if (!response.credential) {
                setError("No credential received from Google");
                return;
              }
              try {
                await login(response.credential);
              } catch (error) {
                if (axios.isAxiosError(error)) {
                  setError(
                    error.response?.data?.detail ||
                      "Sign-in failed. Please try again."
                  );
                  return;
                }

                setError("Sign-in failed. Please try again.");
              }
            }}
            onError={() => setError("Google sign-in failed")}
          />
        </div>
      </div>
    </div>
  );
}
