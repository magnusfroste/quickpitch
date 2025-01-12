import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PresentationViewProps {
  images: any[];
  currentIndex: number;
  isPresenter: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export const PresentationView = ({
  images,
  currentIndex,
  isPresenter,
  onPrevious,
  onNext
}: PresentationViewProps) => {
  if (!images.length) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="relative h-full">
        <img
          src={images[currentIndex]?.image_url}
          alt={`Presentation image ${currentIndex + 1}`}
          className="w-full h-full object-contain"
        />
        {images.length > 1 && isPresenter && (
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/80 hover:bg-white"
              onClick={onPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/80 hover:bg-white"
              onClick={onNext}
              disabled={currentIndex === images.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
        <div className="absolute bottom-4 right-4 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};