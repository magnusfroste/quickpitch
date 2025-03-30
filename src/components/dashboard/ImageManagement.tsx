
import { ImageUploader } from "@/components/ImageUploader";
import { ImageGrid } from "@/components/ImageGrid";
import { ImageAnalysis } from "@/components/ImageAnalysis";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ImageIcon, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageManagementProps {
  onUploadSuccess: () => void;
  refreshTrigger: number;
}

export const ImageManagement = ({ onUploadSuccess, refreshTrigger }: ImageManagementProps) => {
  const [images, setImages] = useState<any[]>([]);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [assistantIdMissing, setAssistantIdMissing] = useState(false);
  const [imagesRefreshCounter, setImagesRefreshCounter] = useState(0);

  useEffect(() => {
    fetchImages();
    checkConfigSettings();
  }, [refreshTrigger, imagesRefreshCounter]);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('presentation_images')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error fetching images:', error);
      return;
    }

    console.log('Dashboard fetched images:', data?.length || 0);
    setImages(data || []);
  };

  const handleImagesChanged = () => {
    console.log('Images changed, refreshing...');
    // Increment the counter to trigger a refresh
    setImagesRefreshCounter(prev => prev + 1);
    // Also call the parent's refresh callback
    onUploadSuccess();
  };

  const checkConfigSettings = () => {
    try {
      // Check OpenAI API Key
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      console.log("OpenAI API Key check:", openaiApiKey ? `Key found (${openaiApiKey.substring(0, 4)}...)` : "Key missing");
      setApiKeyMissing(!openaiApiKey);
      
      // Check Assistant ID
      const assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID;
      console.log("Assistant ID check:", assistantId ? `ID found (${assistantId.substring(0, 4)}...)` : "ID missing");
      setAssistantIdMissing(!assistantId);
    } catch (err) {
      console.error("Error checking OpenAI configuration:", err);
      setApiKeyMissing(true);
      setAssistantIdMissing(true);
    }
  };

  return (
    <Card className="shadow-md border-none overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Pitch Presentation Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="images" className="flex-1">Manage Images</TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1">AI Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="images" className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Pitch Images</h2>
              <ImageUploader onUploadSuccess={handleImagesChanged} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>Your Pitch Images</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {images.length} / 5
                </span>
              </h2>
              <p className="text-gray-500 text-sm mb-4">Click on an image to view it in full size</p>
              <ImageGrid onImagesChanged={handleImagesChanged} />
            </div>

            {(apiKeyMissing || assistantIdMissing) && (
              <div className="mt-4">
                {apiKeyMissing && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>OpenAI API Key Missing</AlertTitle>
                    <AlertDescription>
                      The OpenAI API key is not configured. Please check your .env file and make sure VITE_OPENAI_API_KEY is set.
                    </AlertDescription>
                  </Alert>
                )}

                {assistantIdMissing && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>OpenAI Assistant ID Missing</AlertTitle>
                    <AlertDescription>
                      The OpenAI Assistant ID is not configured. Please check your .env file and make sure VITE_OPENAI_ASSISTANT_ID is set.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analysis" className="p-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Image Analysis
              </h2>
              <p className="text-gray-600">
                Get AI-powered feedback on your presentation images to improve your pitch.
              </p>
            </div>
            
            <ImageAnalysis images={images} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
