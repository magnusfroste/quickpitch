import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface HeroProps {
  channelName: string;
  setChannelName: (value: string) => void;
  onJoinMeeting: () => void;
  onHostMeeting: () => void;
}

export const Hero = ({
  channelName,
  setChannelName,
  onJoinMeeting,
  onHostMeeting,
}: HeroProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Reset states when component mounts
    setImageError(false);
    setImageLoaded(false);

    // Preload the image
    const img = new Image();
    img.src = "/lovable-uploads/0eda0e12-7174-441a-8411-579eda3632f1.png";
    img.onload = () => {
      console.log("Image loaded successfully");
      setImageLoaded(true);
    };
    img.onerror = (e) => {
      console.error("Error loading image:", e);
      setImageError(true);
    };
  }, []);

  return (
    <div className="grid lg:grid-cols-2 gap-16 items-center py-16">
      <div className="space-y-8 text-left">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-apple-text leading-tight">
            Your pitch. 5 slides.<br />
            20 minutes. Done.
          </h1>
          <p className="text-xl text-gray-600">
            Get straight to the point with our time-boxed format.
            Show respect for your prospect's time, and they'll respect your pitch.
          </p>
        </div>
        
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter meeting code"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            className="text-lg p-6 rounded-xl border-gray-300"
          />
          <div className="flex gap-4">
            <Button
              onClick={onJoinMeeting}
              className="flex-1 h-12 text-lg bg-apple-blue hover:bg-blue-700"
            >
              Join Pitch
            </Button>
            <Button
              variant="outline"
              onClick={onHostMeeting}
              className="flex-1 h-12 text-lg border-2"
            >
              Start Pitching
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block relative">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {!imageError && (
            <img
              src="/lovable-uploads/0eda0e12-7174-441a-8411-579eda3632f1.png"
              alt="Person working with tablet"
              className={`w-full h-[500px] object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onError={() => {
                console.error("Image failed to load");
                setImageError(true);
              }}
              onLoad={() => {
                console.log("Image loaded in DOM");
                setImageLoaded(true);
              }}
            />
          )}
          {imageError && (
            <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">Image not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};