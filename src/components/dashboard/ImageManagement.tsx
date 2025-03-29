
import { ImageUploader } from "@/components/ImageUploader";
import { ImageGrid } from "@/components/ImageGrid";
import { ImageAnalysis } from "@/components/ImageAnalysis";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ImageManagementProps {
  onUploadSuccess: () => void;
  refreshTrigger: number;
}

export const ImageManagement = ({ onUploadSuccess, refreshTrigger }: ImageManagementProps) => {
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    fetchImages();
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

      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <ImageAnalysis images={images} />
      </div>
    </>
  );
};
