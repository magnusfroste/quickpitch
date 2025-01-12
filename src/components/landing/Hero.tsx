import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

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

  return (
    <div className="grid lg:grid-cols-2 gap-16 items-center">
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-5xl font-bold text-gray-900 leading-tight">
            Your pitch. 5 slides.<br />
            20 minutes. Done.
          </h2>
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
              className="flex-1 h-12 text-lg bg-blue-600 hover:bg-blue-700"
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

      <div className="hidden lg:block">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden transform translate-x-4">
          {!imageError ? (
            <img
              src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
              alt="Person working with laptop"
              className="w-full h-[500px] object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">Image not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};