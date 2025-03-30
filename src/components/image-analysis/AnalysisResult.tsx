
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AnalysisResultProps {
  analysis: string | null;
}

export const AnalysisResult = ({ analysis }: AnalysisResultProps) => {
  if (!analysis) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
        <CardDescription>AI-generated feedback on your pitch images</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="whitespace-pre-wrap">{analysis}</div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
