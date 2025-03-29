
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // The key is still retrieved from Deno.env as this is a Supabase Edge Function
    // For Edge Functions, environment variables are set in the Supabase dashboard
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const hasKey = !!openaiApiKey && openaiApiKey.length > 0;
    
    console.log("OpenAI API key check:", hasKey ? "Key present" : "Key missing");
    
    if (!hasKey) {
      return new Response(
        JSON.stringify({ 
          hasKey: false,
          error: 'OpenAI API key is not configured' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ hasKey: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-openai-key function:', error);
    return new Response(
      JSON.stringify({ hasKey: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
