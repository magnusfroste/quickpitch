
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// OpenAI Assistant ID for image analysis
const ASSISTANT_ID = "asst_rSCcnqL8PYzpquRTsD8Owuub"; // Replace with your actual Assistant ID

interface ImageAnalysisProps {
  images: { id: number; image_url: string }[];
}

export const ImageAnalysis = ({ images }: ImageAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image to analyze");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysis(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to analyze images");
        return;
      }

      const imageUrls = images.map(img => img.image_url);
      console.log("Analyzing images:", imageUrls);

      // Create a new thread
      const threadResponse = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY || 'sk-dummy-key-for-development'}`
        },
        body: JSON.stringify({})
      });

      if (!threadResponse.ok) {
        throw new Error(`Failed to create thread: ${await threadResponse.text()}`);
      }

      const threadData = await threadResponse.json();
      const threadId = threadData.id;
      console.log("Thread created with ID:", threadId);

      // Create a message with image URLs
      const messageContent = {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze these pitch deck images and provide feedback on how they can be improved for clarity, design, and impact."
          },
          ...imageUrls.map(url => ({
            type: "image_url",
            image_url: { url }
          }))
        ]
      };

      const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY || 'sk-dummy-key-for-development'}`
        },
        body: JSON.stringify(messageContent)
      });

      if (!messageResponse.ok) {
        throw new Error(`Failed to create message: ${await messageResponse.text()}`);
      }
      console.log("Message created successfully");

      // Run the assistant
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY || 'sk-dummy-key-for-development'}`
        },
        body: JSON.stringify({
          assistant_id: ASSISTANT_ID
        })
      });

      if (!runResponse.ok) {
        throw new Error(`Failed to run assistant: ${await runResponse.text()}`);
      }

      const runData = await runResponse.json();
      const runId = runData.id;
      console.log("Run created with ID:", runId);

      // Poll for completion
      let runStatus = runData.status;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5s * 60)
      
      const pollInterval = setInterval(async () => {
        attempts++;
        console.log(`Poll attempt ${attempts}, current status: ${runStatus}`);
        
        if (runStatus === 'completed' || runStatus === 'failed' || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          
          if (runStatus !== 'completed') {
            console.error(`Run did not complete. Final status: ${runStatus}`);
            throw new Error(`Analysis did not complete successfully. Status: ${runStatus}`);
          }
          
          // Retrieve messages
          console.log("Retrieving messages...");
          const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: {
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY || 'sk-dummy-key-for-development'}`
            }
          });

          if (!messagesResponse.ok) {
            throw new Error(`Failed to retrieve messages: ${await messagesResponse.text()}`);
          }

          const messagesData = await messagesResponse.json();
          console.log("Messages retrieved successfully");
          
          // Extract the assistant's response
          const assistantMessages = messagesData.data.filter(msg => msg.role === 'assistant');
          
          if (assistantMessages.length > 0) {
            const latestMessage = assistantMessages[0];
            const analysisResult = latestMessage.content[0].text.value;
            console.log("Analysis result extracted successfully");
            setAnalysis(analysisResult);
            
            // Store the analysis in Supabase
            const { error } = await supabase
              .from('image_analyses')
              .insert({
                user_id: user.id,
                analysis: analysisResult,
                created_at: new Date().toISOString()
              });
              
            if (error) {
              console.error('Error storing analysis in database:', error);
            }
          } else {
            console.warn("No assistant messages found");
            throw new Error("No response received from the AI assistant");
          }
          
          setIsAnalyzing(false);
          toast.success("Images analyzed successfully");
        } else {
          // Check status
          const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
            headers: {
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY || 'sk-dummy-key-for-development'}`
            }
          });
          
          if (!statusResponse.ok) {
            clearInterval(pollInterval);
            throw new Error(`Failed to check run status: ${await statusResponse.text()}`);
          }
          
          const statusData = await statusResponse.json();
          runStatus = statusData.status;
        }
      }, 5000);
      
    } catch (error) {
      console.error("Error analyzing images:", error);
      setIsAnalyzing(false);
      toast.error(error instanceof Error ? error.message : "Failed to analyze images");
    }
  };

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

      {analysis && (
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
      )}

      {!analysis && !isAnalyzing && (
        <div className="text-center p-6 border border-dashed rounded-lg bg-gray-50">
          <p className="text-gray-500">
            Click "Analyze Images" to get AI feedback on your pitch images
          </p>
        </div>
      )}

      {isAnalyzing && (
        <div className="text-center p-6 border rounded-lg bg-gray-50 animate-pulse">
          <p className="text-gray-500">
            Analyzing your images... This may take a minute or two.
          </p>
        </div>
      )}
    </div>
  );
};
