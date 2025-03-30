
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisResponse } from "@/hooks/useImageAnalysis";

interface AnalysisResultProps {
  analysis: AnalysisResponse | null;
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
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="individual">Individual Images</TabsTrigger>
            <TabsTrigger value="overall">Overall Feedback</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="whitespace-pre-wrap">{analysis.summary}</div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="individual">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-4">
                {analysis.imageAnalyses.map((imageAnalysis, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Image {imageAnalysis.imageIndex + 1}</h3>
                    <p className="whitespace-pre-wrap">{imageAnalysis.feedback}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="overall">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="whitespace-pre-wrap">{analysis.overallFeedback}</div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
