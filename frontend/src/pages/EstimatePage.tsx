import { SearchLg } from "@untitledui/icons";
import { useState } from "react";
import Alert from "@/components/ui/Alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { estimateEffort } from "../api/client";
import type { EstimationRequest, EstimationResponse } from "../types/project";
import EstimationForm from "../components/EstimationForm";
import EstimationResult from "../components/EstimationResult";

export default function EstimatePage() {
  const [result, setResult] = useState<EstimationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEstimate = async (data: EstimationRequest) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await estimateEffort(data);
      setResult(response);
    } catch {
      setError(
        "Failed to generate estimate. Make sure the backend is running and you have projects recorded."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-secondary">
          AI-assisted planning
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-primary">
          Estimate a new project
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Upload source docs, review the extracted scope, and generate a delivery
          estimate grounded in similar historical work.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
        <div className="min-w-0">
          <EstimationForm onSubmit={handleEstimate} loading={loading} />
        </div>

        <div className="min-w-0 space-y-4">
          {loading && (
            <Card>
              <CardContent className="px-6 py-10 text-center">
                <Spinner size="lg" className="mx-auto text-brand-primary" />
                <p className="mt-4 text-sm font-medium text-primary">
                  Analyzing similar projects and generating the estimate...
                </p>
                <p className="mt-2 text-sm text-secondary">
                  This is the part where the app pretends it doesn&apos;t enjoy being
                  smarter than a spreadsheet.
                </p>
              </CardContent>
            </Card>
          )}

          {error && <Alert tone="error">{error}</Alert>}

          {result && <EstimationResult result={result} />}

          {!loading && !error && !result && (
            <Card>
              <CardHeader>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-primary text-brand-primary">
                  <SearchLg className="size-5" />
                </div>
                <CardTitle className="mt-4">Results will appear here</CardTitle>
                <CardDescription>
                  Once you run an estimate, you&apos;ll see duration, effort,
                  confidence, implementation phases, and similar projects.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
