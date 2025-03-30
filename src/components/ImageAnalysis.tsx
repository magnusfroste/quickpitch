
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { StatusMessage } from "@/components/image-analysis/StatusMessage";
import { AnalysisResult } from "@/components/image-analysis/AnalysisResult";
import { ErrorDisplay } from "@/components/image-analysis/ErrorDisplay";
import { EmptyState } from "@/components/image-analysis/EmptyState";

interface ImageAnalysisProps {
  images: { id: number; image_url: string }[];
}

export const ImageAnalysis = ({ images }: ImageAnalysisProps) => {
  const {
    isAnalyzing,
    analysis,
    error,
    statusMessage,
    handleAnalyze
  } = useImageAnalysis({ images });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">AI Image Analysis</h2>
        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing || images.length === 0}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {isAnalyzing ? "Analyzing..." : "Analyze Images"}
        </Button>
      </div>

      <StatusMessage message={statusMessage} />
      <AnalysisResult analysis={analysis} />
      <ErrorDisplay error={error} />

      {!analysis && !error && !statusMessage && (
        <EmptyState isAnalyzing={isAnalyzing} />
      )}
    </div>
  );
};
