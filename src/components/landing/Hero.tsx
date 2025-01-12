import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          <img
            src="/lovable-uploads/48ecab87-1aa6-4b3f-9b40-995e3d15ef3e.png"
            alt="Person working with tablet"
            className="w-full h-[500px] object-cover"
          />
        </div>
      </div>
    </div>
  );
};