import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PresentationImage {
  id: number;
  image_url: string;
  sort_order: number;
}

export const ImageGrid = () => {
  const [images, setImages] = useState<PresentationImage[]>([]);

  useEffect(() => {
    console.log("Fetching images...");
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('presentation_images')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to fetch images');
      return;
    }

    console.log('Fetched images:', data);
    setImages(data || []);
  };

  const handleDelete = async (id: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to delete images');
      return;
    }

    try {
      const { error } = await supabase
        .from('presentation_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setImages(images.filter(img => img.id !== id));
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {images.map((image) => (
        <div key={image.id} className="relative group bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="aspect-[16/9] relative">
            <img
              src={image.image_url}
              alt={`Presentation image ${image.id}`}
              className="absolute inset-0 w-full h-full object-contain bg-gray-50"
            />
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
            <Button
              variant="destructive"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={() => handleDelete(image.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};