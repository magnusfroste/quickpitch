
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Video } from "lucide-react";
import { toast } from "sonner";

interface MeetingControlsProps {
  channelName: string;
  onChannelNameChange: (value: string) => void;
  onJoinMeeting: () => void;
}

export const MeetingControls = ({
  channelName,
  onChannelNameChange,
  onJoinMeeting,
}: MeetingControlsProps) => {
  const getMeetingUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/meeting/${channelName}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getMeetingUrl());
      toast.success("Meeting link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy meeting link");
    }
  };

  const isChannelNameValid = channelName.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="channel-name" className="text-white font-semibold text-sm">Meeting Code</Label>
        <Input
          id="channel-name"
          value={channelName}
          onChange={(e) => onChannelNameChange(e.target.value)}
          placeholder="Enter meeting code"
          className="bg-white/20 border-white/10 text-white placeholder:text-white/60 focus:border-white focus-visible:ring-1 focus-visible:ring-white"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onJoinMeeting}
          disabled={!isChannelNameValid}
          className="bg-white hover:bg-gray-100"
        >
          <Video className="h-4 w-4 text-blue-600" />
          <span className="text-blue-600 font-medium">Start Meeting</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={copyToClipboard}
          disabled={!isChannelNameValid}
          className="border-white text-white hover:bg-white/20"
        >
          <Copy className="h-4 w-4" />
          <span className="font-medium">Copy Invitation Link</span>
        </Button>
      </div>
    </div>
  );
};
