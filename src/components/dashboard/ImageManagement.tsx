
import { ImageUploader } from "@/components/ImageUploader";
import { ImageGrid } from "@/components/ImageGrid";
import { ImageAnalysis } from "@/components/ImageAnalysis";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

    setImages(data || []);
  };

  const handleImagesChanged = () => {
    // Increment the counter to trigger a refresh
    setImagesRefreshCounter(prev => prev + 1);
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
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Image Management</h2>
        <ImageUploader onUploadSuccess={() => {
          onUploadSuccess();
          handleImagesChanged();
        }} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Pitch Images</h2>
        <ImageGrid onImagesChanged={handleImagesChanged} />
      </div>

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

      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <ImageAnalysis images={images} />
      </div>
    </>
  );
};
