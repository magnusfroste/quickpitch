
import { ImageUploader } from "@/components/ImageUploader";
import { ImageGrid } from "@/components/ImageGrid";
import { ImageAnalysis } from "@/components/ImageAnalysis";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ImageManagementProps {
  onUploadSuccess: () => void;
  refreshTrigger: number;
}

export const ImageManagement = ({ onUploadSuccess, refreshTrigger }: ImageManagementProps) => {
  const [images, setImages] = useState<any[]>([]);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [assistantIdMissing, setAssistantIdMissing] = useState(false);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);

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
      setIsCheckingConfig(true);
      const { data, error } = await supabase.functions.invoke('verify-openai-key');
      
      console.log("Config check response:", data);
      
      if (error) {
        console.error("Error checking config:", error);
        toast.error("Failed to verify OpenAI configuration");
        setApiKeyMissing(true);
        setAssistantIdMissing(true);
        return;
      }
      
      setApiKeyMissing(!data?.hasKey);
      setAssistantIdMissing(!data?.hasAssistantId);
      
      // Double-check assistant ID from env if the edge function says it's missing
      if (!data?.hasAssistantId) {
        const clientSideAssistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID;
        if (clientSideAssistantId) {
          console.log("Client-side Assistant ID found:", clientSideAssistantId.substring(0, 4) + "...");
          setAssistantIdMissing(false);
        }
      }
    } catch (err) {
      console.error("Error checking OpenAI configuration:", err);
      setApiKeyMissing(true);
      setAssistantIdMissing(true);
    } finally {
      setIsCheckingConfig(false);
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

      {isCheckingConfig && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Checking OpenAI Configuration</AlertTitle>
          <AlertDescription>
            Verifying OpenAI API key and Assistant ID...
          </AlertDescription>
        </Alert>
      )}

      {!isCheckingConfig && apiKeyMissing && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>OpenAI API Key Missing</AlertTitle>
          <AlertDescription>
            The OpenAI API key is not configured. Please add it to your .env file or Supabase project secrets.
            If you've already added it, try restarting the application or deploying again.
          </AlertDescription>
        </Alert>
      )}

      {!isCheckingConfig && assistantIdMissing && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>OpenAI Assistant ID Missing</AlertTitle>
          <AlertDescription>
            The OpenAI Assistant ID is not configured. Please add it to your .env file or Supabase project secrets.
            If you've already added it, try restarting the application or deploying again.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <ImageAnalysis images={images} />
      </div>
    </>
  );
};
