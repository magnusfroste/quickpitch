import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VideoRoom from "@/components/VideoRoom";
import { toast } from "sonner";

const Index = () => {
  const [channelName, setChannelName] = useState("");
  const [inCall, setInCall] = useState(false);

  const joinMeeting = () => {
    if (!channelName) {
      toast.error("Please enter a meeting code");
      return;
    }
    setInCall(true);
  };

  if (inCall) {
    return <VideoRoom channelName={channelName} onLeave={() => setInCall(false)} />;
  }

  return (
    <div className="min-h-screen bg-apple-gray flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-apple-text mb-6">
            Join a Meeting
          </h1>
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter meeting code"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              onClick={joinMeeting}
              className="w-full bg-apple-blue hover:bg-apple-blue/90"
            >
              Join Meeting
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;