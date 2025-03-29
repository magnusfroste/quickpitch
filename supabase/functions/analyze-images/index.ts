
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Load and log environment variables
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const assistantId = Deno.env.get('OPENAI_ASSISTANT_ID');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

console.log("Environment variables check:");
console.log("- OpenAI API Key:", openaiApiKey ? `Found (${openaiApiKey.substring(0, 5)}...)` : "Missing");
console.log("- Assistant ID:", assistantId ? `Found (${assistantId})` : "Missing");
console.log("- Supabase URL:", supabaseUrl ? "Found" : "Missing");
console.log("- Supabase Service Key:", supabaseServiceKey ? "Found" : "Missing");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrls, userId } = await req.json();

    if (!openaiApiKey) {
      console.error("OpenAI API key is not configured");
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!assistantId) {
      console.error("OpenAI Assistant ID is not configured");
      return new Response(
        JSON.stringify({ error: 'OpenAI Assistant ID is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images provided for analysis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Creating thread with OpenAI...");
    // Create a thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({})
    });

    if (!threadResponse.ok) {
      const errorData = await threadResponse.json();
      console.error("Thread creation error:", errorData);
      throw new Error(`Failed to create thread: ${JSON.stringify(errorData)}`);
    }

    const threadData = await threadResponse.json();
    const threadId = threadData.id;
    console.log("Thread created with ID:", threadId);

    // Create a message with image URLs
    console.log("Creating message with images...");
    const messageContent = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Please analyze these pitch deck images for story, clarity, and effectiveness. Provide feedback on each image individually and how they work together as a pitch deck.'
        },
        ...imageUrls.map(url => ({
          type: 'image_url',
          image_url: {
            url
          }
        }))
      ]
    };

    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify(messageContent)
    });

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json();
      console.error("Message creation error:", errorData);
      throw new Error(`Failed to create message: ${JSON.stringify(errorData)}`);
    }
    console.log("Message created successfully");

    // Run the assistant
    console.log("Running the assistant...");
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    if (!runResponse.ok) {
      const errorData = await runResponse.json();
      console.error("Run creation error:", errorData);
      throw new Error(`Failed to run assistant: ${JSON.stringify(errorData)}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;
    console.log("Run created with ID:", runId);

    // Poll for completion
    let runStatus = runData.status;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5s * 60)
    console.log("Polling for run completion...");

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
      console.log(`Poll attempt ${attempts + 1}, current status: ${runStatus}`);
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      });
      
      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        console.error("Status check error:", errorData);
        throw new Error(`Failed to check run status: ${JSON.stringify(errorData)}`);
      }
      
      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      attempts++;
    }

    if (runStatus !== 'completed') {
      console.error(`Run did not complete. Final status: ${runStatus}`);
      throw new Error(`Run did not complete successfully. Status: ${runStatus}`);
    }
    console.log("Run completed successfully");

    // Retrieve messages
    console.log("Retrieving messages...");
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'OpenAI-Beta': 'assistants=v1'
      }
    });

    if (!messagesResponse.ok) {
      const errorData = await messagesResponse.json();
      console.error("Message retrieval error:", errorData);
      throw new Error(`Failed to retrieve messages: ${JSON.stringify(errorData)}`);
    }

    const messagesData = await messagesResponse.json();
    console.log("Messages retrieved successfully");
    
    // Extract the assistant's response
    const assistantMessages = messagesData.data.filter(msg => msg.role === 'assistant');
    let analysisResult = '';
    
    if (assistantMessages.length > 0) {
      const latestMessage = assistantMessages[0];
      analysisResult = latestMessage.content[0].text.value;
      console.log("Analysis result extracted successfully");
    } else {
      console.warn("No assistant messages found");
    }

    // Store the analysis in Supabase if we have a valid response
    if (analysisResult && userId) {
      console.log("Storing analysis in database...");
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { error } = await supabase
        .from('image_analyses')
        .insert({
          user_id: userId,
          analysis: analysisResult,
          created_at: new Date().toISOString(),
          image_count: imageUrls.length
        });
        
      if (error) {
        console.error('Error storing analysis in database:', error);
      } else {
        console.log("Analysis stored in database successfully");
      }
    }

    console.log("Returning analysis result");
    return new Response(
      JSON.stringify({ analysis: analysisResult, threadId, runId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in analyze-images function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
