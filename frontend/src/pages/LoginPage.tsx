import { Folder } from "@untitledui/icons";
import { GoogleLogin } from "@react-oauth/google";
import Alert from "@/components/ui/Alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState("");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary_alt px-4 py-12">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(127,86,217,0.18),_transparent_60%)]" />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Card className="relative w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-solid text-primary_on-brand shadow-xs-skeuomorphic">
            <Folder className="size-6" />
          </div>
          <CardTitle className="mt-4 text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in with your @d-teknoloji.com.tr account to access projects,
            imports, and AI-assisted estimations.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && <Alert tone="error">{error}</Alert>}

          <div className="rounded-2xl border border-secondary bg-secondary p-4">
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
                    setError(
                      error instanceof Error && error.message
                        ? error.message
                        : "Sign-in failed. Please try again.",
                    );
                  }
                }}
                onError={() => setError("Google sign-in failed")}
              />
            </div>
          </div>

          <p className="text-center text-xs text-tertiary">
            Access is limited to approved internal accounts. If Google refuses
            the sign-in, your domain or session is probably the culprit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
