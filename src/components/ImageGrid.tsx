import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PresentationImage {
  id: number;
  image_url: string;
  sort_order: number;
}

interface ImageGridProps {
  onImagesChanged?: () => void;
}

export const ImageGrid = ({ onImagesChanged }: ImageGridProps) => {
  const [images, setImages] = useState<PresentationImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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
    onImagesChanged?.();
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
      onImagesChanged?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    }
  };

  const openImagePreview = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setPreviewOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative group bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="relative">
              <AspectRatio ratio={16/9} className="w-full">
                <img
                  src={image.image_url}
                  alt={`Presentation image ${image.id}`}
                  className="absolute inset-0 w-full h-full object-contain bg-gray-50"
                />
              </AspectRatio>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                onClick={() => openImagePreview(image.image_url)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
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

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-[90vw]">
          {selectedImage && (
            <div className="w-full">
              <img
                src={selectedImage}
                alt="Full size preview"
                className="w-full h-auto object-contain max-h-[80vh]"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
