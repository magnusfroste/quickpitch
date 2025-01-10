import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VideoRoom from "@/components/VideoRoom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Share2 } from "lucide-react";

const Index = () => {
  const [channelName, setChannelName] = useState("");
  const [inCall, setInCall] = useState(false);

  const generateMeetingCode = () => {
    // Always generate "lovable" as the meeting code
    setChannelName("lovable");
    return "lovable";
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Meeting code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy meeting code");
    }
  };

  const shareMeeting = async () => {
    const shareData = {
      title: "Join my video meeting",
      text: `Join my video meeting with code: ${channelName}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error("Web Share API not supported");
      }
    } catch (err) {
      copyToClipboard(`Join my video meeting with code: ${channelName}`);
    }
  };

  const joinMeeting = () => {
    if (!channelName) {
      toast.error("Please enter a meeting code");
      return;
    }
    if (channelName !== "lovable") {
      toast.error("Invalid meeting code. Please use 'lovable'");
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
            Video Meeting
          </h1>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Enter meeting code"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="flex-1"
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => generateMeetingCode()}
                  >
                    Host
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Meeting Code</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg">
                      <span className="flex-1 font-mono">{channelName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(channelName)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={shareMeeting}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={joinMeeting}
                      className="w-full bg-apple-blue hover:bg-apple-blue/90"
                    >
                      Join Meeting
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
