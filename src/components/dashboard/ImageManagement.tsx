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

  useEffect(() => {
    fetchImages();
    checkConfigSettings();
  }, [refreshTrigger]);

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

  const checkConfigSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-openai-key', {
        body: { checkOnly: true }
      });
      
      if (error || !data?.hasKey) {
        console.warn("OpenAI API key not configured");
        setApiKeyMissing(true);
      } else {
        setApiKeyMissing(false);
      }

      const assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID;
      if (!assistantId) {
        console.warn("OpenAI Assistant ID not configured");
        setAssistantIdMissing(true);
      } else {
        setAssistantIdMissing(false);
      }
    } catch (err) {
      console.error("Error checking OpenAI configuration:", err);
      setApiKeyMissing(true);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Image Management</h2>
        <ImageUploader onUploadSuccess={onUploadSuccess} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Pitch Images</h2>
        <ImageGrid key={refreshTrigger} />
      </div>

      {apiKeyMissing && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>OpenAI API Key Missing</AlertTitle>
          <AlertDescription>
            The OpenAI API key is not configured. Please add it to your .env file or Supabase project secrets.
          </AlertDescription>
        </Alert>
      )}

      {assistantIdMissing && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>OpenAI Assistant ID Missing</AlertTitle>
          <AlertDescription>
            The OpenAI Assistant ID is not configured. Please add it to your .env file or Supabase project secrets.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <ImageAnalysis images={images} />
      </div>
    </>
  );
};
