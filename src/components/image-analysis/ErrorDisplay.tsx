
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  error: string | null;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  if (!error) return null;
  
  return (
    <Card className="border-red-300 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-red-600">{error}</div>
        <div className="mt-2">
          <p className="text-sm text-red-500">
            Check the console for more details about the error.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
