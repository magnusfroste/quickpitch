
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OpenAI from "openai";

interface UseImageAnalysisProps {
  images: { id: number; image_url: string }[];
}

export const useImageAnalysis = ({ images }: UseImageAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image to analyze");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysis(null);
      setError(null);
      setStatusMessage("Preparing to analyze images...");

      // Get OpenAI API key and Assistant ID from environment variables
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID;
      
      console.log("Environment variables check:");
      console.log("- OpenAI API Key:", openaiApiKey ? `Found (${openaiApiKey.substring(0, 5)}...)` : "Missing");
      console.log("- Assistant ID:", assistantId ? `Found (${assistantId})` : "Missing");
      
      if (!openaiApiKey) {
        throw new Error("OpenAI API key is not configured. Please add it to your .env file.");
      }

      if (!assistantId) {
        throw new Error("OpenAI Assistant ID is not configured. Please add it to your .env file.");
      }

      // Get current user
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

      // Initialize OpenAI client with the beta flag
      const openai = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
      });

      setStatusMessage("Creating thread...");
      console.log("Creating thread...");
      
      // Create a thread
      const thread = await openai.beta.threads.create();
      console.log("Thread created with ID:", thread.id);

      // Prepare message content
      setStatusMessage("Adding images to thread...");
      console.log("Creating message with images...");
      
      // First create the initial text message
      const textContent = {
        type: "text" as const,
        text: "Please analyze these pitch deck images for story, clarity, and effectiveness. Provide feedback on each image individually and how they work together as a pitch deck."
      };
      
      // Create separate array for the content
      const messageContent: Array<OpenAI.Beta.Threads.Messages.MessageContentPartParam> = [textContent];
      
      // Add each image to the content array
      for (const image of images) {
        messageContent.push({
          type: "image_url" as const,
          image_url: {
            url: image.image_url
          }
        });
      }

      // Add message to thread
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: messageContent
      });
      console.log("Message created successfully");

      // Run the assistant
      setStatusMessage("Running assistant...");
      console.log("Running assistant with ID:", assistantId);
      
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId
      });
      console.log("Run created with ID:", run.id);

      // Poll for completion
      setStatusMessage("Waiting for analysis to complete...");
      let runStatus = run.status;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5s * 60)
      
      while (runStatus !== "completed" && runStatus !== "failed" && attempts < maxAttempts) {
        attempts++;
        console.log(`Poll attempt ${attempts}, current status: ${runStatus}`);
        setStatusMessage(`Waiting for analysis... Status: ${runStatus} (${attempts}/${maxAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const runResponse = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        runStatus = runResponse.status;
      }
      
      if (runStatus !== "completed") {
        console.error(`Run did not complete. Final status: ${runStatus}`);
        throw new Error(`Analysis did not complete successfully. Status: ${runStatus}`);
      }
      
      // Retrieve messages
      setStatusMessage("Retrieving analysis results...");
      console.log("Retrieving messages...");
      
      const messages = await openai.beta.threads.messages.list(thread.id);
      console.log("Messages retrieved successfully");
      
      // Extract the assistant's response
      const assistantMessages = messages.data.filter(msg => msg.role === "assistant");
      
      if (assistantMessages.length > 0) {
        const latestMessage = assistantMessages[0];
        console.log("Latest assistant message:", latestMessage);
        
        if (latestMessage.content && latestMessage.content.length > 0) {
          const textContent = latestMessage.content.find(content => content.type === "text");
          
          if (textContent && "text" in textContent) {
            const analysisResult = textContent.text.value;
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
            throw new Error("No text content found in the assistant's response");
          }
        } else {
          console.error("Unexpected message format:", latestMessage);
          throw new Error("Could not extract analysis result from API response");
        }
      } else {
        console.warn("No assistant messages found");
        throw new Error("No response received from the AI assistant");
      }

    } catch (error) {
      console.error("Error analyzing images:", error);
      setError(error instanceof Error ? error.message : "Failed to analyze images");
      toast.error(error instanceof Error ? error.message : "Failed to analyze images");
    } finally {
      setIsAnalyzing(false);
      setStatusMessage(null);
    }
  };

  return {
    isAnalyzing,
    analysis,
    error,
    statusMessage,
    handleAnalyze
  };
};
