
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusMessageProps {
  message: string | null;
}

export const StatusMessage = ({ message }: StatusMessageProps) => {
  if (!message) return null;
  
  return (
    <Card className="border-blue-300 bg-blue-50">
      <CardHeader className="py-3">
        <CardTitle className="text-blue-600 text-sm">Status</CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="text-blue-600 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
          {message}
        </div>
      </CardContent>
    </Card>
  );
};
