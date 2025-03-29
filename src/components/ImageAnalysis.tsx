
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// OpenAI Assistant ID for image analysis
const ASSISTANT_ID = "asst_rSCcnqL8PYzpquRTsD8Owuub";

interface ImageAnalysisProps {
  images: { id: number; image_url: string }[];
}

export const ImageAnalysis = ({ images }: ImageAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image to analyze");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysis(null);
      setApiResponse(null);
      setError(null);
      setApiStatus("Starting analysis via Edge Function...");

      // Get current user
      console.log("Getting current user...");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        throw new Error(`Failed to get user: ${userError.message}`);
      }
      
      if (!user) {
        console.error("No user found");
        toast.error("You must be logged in to analyze images");
        return;
      }
      
      console.log("User authenticated:", user.id);

      const imageUrls = images.map(img => img.image_url);
      console.log(`Analyzing ${images.length} images:`, imageUrls);

      // Try using the Edge Function
      setApiStatus("Calling Edge Function...");
      console.log("Calling analyze-images Edge Function...");
      const response = await fetch(`${window.location.origin}/functions/v1/analyze-images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`
        },
        body: JSON.stringify({
          imageUrls,
          userId: user.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Edge function failed:", errorText);
        throw new Error(`Edge function failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log("Edge function response:", result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.analysis) {
        console.log("Analysis received successfully");
        setAnalysis(result.analysis);
        setApiResponse(result);
        toast.success("Images analyzed successfully");
      } else {
        console.error("No analysis in result:", result);
        throw new Error("No analysis returned from the API");
      }
    } catch (error) {
      console.error("Error analyzing images:", error);
      setError(error instanceof Error ? error.message : "Failed to analyze images");
      toast.error(error instanceof Error ? error.message : "Failed to analyze images");
      setApiStatus("Edge Function failed, trying direct API...");
      await handleAnalyzeWithOpenAI();
    } finally {
      setApiStatus(null);
      if (!analysis && !error) {
        setIsAnalyzing(false);
      }
    }
  };

  // Direct OpenAI API calls if edge function fails
  const handleAnalyzeWithOpenAI = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image to analyze");
      return;
    }

    try {
      setIsAnalyzing(true);
      if (!analysis) {
        setAnalysis(null);
      }
      if (!apiResponse) {
        setApiResponse(null);
      }
      setError(null);
      setApiStatus("Starting analysis via direct API...");

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to analyze images");
        return;
      }

      const imageUrls = images.map(img => img.image_url);
      console.log("Analyzing images with direct API:", imageUrls);

      // First, verify we have the OpenAI API key
      const { data: secrets, error: secretsError } = await supabase.functions.invoke('verify-openai-key', {
        body: { checkOnly: true }
      });
      
      if (secretsError || !secrets?.hasKey) {
        console.error("OpenAI API key not found:", secretsError || "Key missing");
        throw new Error("OpenAI API key not configured. Please add it in Supabase settings.");
      }

      // Create a new thread
      setApiStatus("Creating OpenAI thread...");
      console.log("Creating thread...");
      
      const threadResponse = await supabase.functions.invoke('openai-thread-create', {
        body: {}
      });
      
      if (threadResponse.error) {
        console.error("Thread creation error:", threadResponse.error);
        throw new Error(`Failed to create thread: ${threadResponse.error}`);
      }
      
      const threadId = threadResponse.data.id;
      console.log("Thread created with ID:", threadId);

      // Create a message with image URLs
      setApiStatus("Adding images to thread...");
      console.log("Creating message with images...");
      
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

      const messageResponse = await supabase.functions.invoke('openai-message-create', {
        body: {
          threadId,
          message: messageContent
        }
      });

      if (messageResponse.error) {
        console.error("Message creation error:", messageResponse.error);
        throw new Error(`Failed to create message: ${messageResponse.error}`);
      }
      
      console.log("Message created successfully");

      // Run the assistant
      setApiStatus("Running assistant...");
      console.log("Running assistant with ID:", ASSISTANT_ID);
      
      const runResponse = await supabase.functions.invoke('openai-run-assistant', {
        body: {
          threadId,
          assistantId: ASSISTANT_ID
        }
      });

      if (runResponse.error) {
        console.error("Run creation error:", runResponse.error);
        throw new Error(`Failed to run assistant: ${runResponse.error}`);
      }

      const runId = runResponse.data.id;
      console.log("Run created with ID:", runId);

      // Poll for completion
      setApiStatus("Waiting for analysis to complete...");
      let runStatus = runResponse.data.status;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5s * 60)
      
      const pollInterval = setInterval(async () => {
        attempts++;
        console.log(`Poll attempt ${attempts}, current status: ${runStatus}`);
        setApiStatus(`Waiting for analysis... Status: ${runStatus} (${attempts}/${maxAttempts})`);
        
        if (runStatus === 'completed' || runStatus === 'failed' || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          
          if (runStatus !== 'completed') {
            console.error(`Run did not complete. Final status: ${runStatus}`);
            throw new Error(`Analysis did not complete successfully. Status: ${runStatus}`);
          }
          
          // Retrieve messages
          setApiStatus("Retrieving analysis results...");
          console.log("Retrieving messages...");
          
          const messagesResponse = await supabase.functions.invoke('openai-messages-list', {
            body: {
              threadId
            }
          });

          if (messagesResponse.error) {
            console.error("Message retrieval error:", messagesResponse.error);
            throw new Error(`Failed to retrieve messages: ${messagesResponse.error}`);
          }

          const messagesData = messagesResponse.data;
          console.log("Messages retrieved successfully:", messagesData);
          
          // Store raw API response for debugging
          setApiResponse(messagesData);
          
          // Extract the assistant's response
          const assistantMessages = messagesData.data.filter(msg => msg.role === 'assistant');
          
          if (assistantMessages.length > 0) {
            const latestMessage = assistantMessages[0];
            console.log("Latest assistant message:", latestMessage);
            
            if (latestMessage.content && latestMessage.content.length > 0 && latestMessage.content[0].text) {
              const analysisResult = latestMessage.content[0].text.value;
              console.log("Analysis result extracted successfully");
              setAnalysis(analysisResult);
              
              // Store the analysis in Supabase
              const { error } = await supabase
                .from('image_analyses')
                .insert({
                  user_id: user.id,
                  analysis: analysisResult,
                  image_count: images.length,
                  created_at: new Date().toISOString()
                });
                
              if (error) {
                console.error('Error storing analysis in database:', error);
                toast.error(`Error storing analysis: ${error.message}`);
              } else {
                console.log("Analysis stored in database successfully");
              }
              
              toast.success("Images analyzed successfully");
            } else {
              console.error("Unexpected message format:", latestMessage);
              throw new Error("Could not extract analysis result from API response");
            }
          } else {
            console.warn("No assistant messages found");
            throw new Error("No response received from the AI assistant");
          }
          
          setIsAnalyzing(false);
          setApiStatus(null);
        } else {
          // Check status
          const statusResponse = await supabase.functions.invoke('openai-run-retrieve', {
            body: {
              threadId,
              runId
            }
          });
          
          if (statusResponse.error) {
            console.error("Status check error:", statusResponse.error);
            clearInterval(pollInterval);
            throw new Error(`Failed to check run status: ${statusResponse.error}`);
          }
          
          runStatus = statusResponse.data.status;
          console.log("Updated run status:", runStatus);
        }
      }, 5000);
    } catch (error) {
      console.error("Error analyzing images with direct API:", error);
      setError(error instanceof Error ? error.message : "Failed to analyze images");
      setIsAnalyzing(false);
      setApiStatus(null);
      toast.error(error instanceof Error ? error.message : "Failed to analyze images");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">AI Image Analysis</h2>
        <div className="flex gap-2">
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || images.length === 0}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "Analyze with Edge Function"}
          </Button>
          <Button 
            onClick={handleAnalyzeWithOpenAI} 
            disabled={isAnalyzing || images.length === 0}
            variant="outline" 
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "Analyze with Direct API"}
          </Button>
        </div>
      </div>

      {apiStatus && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader className="py-3">
            <CardTitle className="text-blue-600 text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-blue-600 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
              {apiStatus}
            </div>
          </CardContent>
        </Card>
      )}

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

      {error && (
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
                Check the console for more details. You may need to set up the OPENAI_API_KEY in your Supabase project secrets.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!analysis && !error && !isAnalyzing && !apiStatus && (
        <div className="text-center p-6 border border-dashed rounded-lg bg-gray-50">
          <p className="text-gray-500">
            Click "Analyze Images" to get AI feedback on your pitch images
          </p>
          <p className="text-xs text-gray-400 mt-2">
            You must have at least one image uploaded
          </p>
        </div>
      )}

      {isAnalyzing && !apiStatus && (
        <div className="text-center p-6 border rounded-lg bg-gray-50">
          <div className="flex justify-center mb-3">
            <div className="animate-spin h-6 w-6 border-3 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
          <p className="text-gray-500">
            Analyzing your images... This may take a minute or two.
          </p>
        </div>
      )}
      
      {apiResponse && (
        <details className="mt-4 border rounded p-2">
          <summary className="cursor-pointer font-medium">Debug: API Response</summary>
          <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
