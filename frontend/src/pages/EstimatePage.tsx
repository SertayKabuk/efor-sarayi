import { useState } from "react";
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
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Estimate New Project
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <EstimationForm onSubmit={handleEstimate} loading={loading} />
        </div>
        <div>
          {loading && (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Analyzing similar projects and generating estimate...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}
          {result && <EstimationResult result={result} />}
        </div>
      </div>
    </div>
  );
}
