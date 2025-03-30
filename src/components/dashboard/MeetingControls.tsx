
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
        <Label htmlFor="channel-name" className="text-white font-medium text-sm">Meeting Code</Label>
        <Input
          id="channel-name"
          value={channelName}
          onChange={(e) => onChannelNameChange(e.target.value)}
          placeholder="Enter meeting code"
          className="bg-white/20 border-white/10 text-white placeholder:text-white/60 focus:border-white"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onJoinMeeting}
          className="bg-white text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium"
          disabled={!isChannelNameValid}
        >
          <Video className="h-4 w-4" />
          Start Meeting
        </Button>
        <Button
          variant="outline"
          onClick={copyToClipboard}
          className="border-white/30 text-white hover:bg-white/20 flex items-center gap-2 whitespace-nowrap font-medium"
          disabled={!isChannelNameValid}
        >
          <Copy className="h-4 w-4" />
          Copy Invitation Link
        </Button>
      </div>
    </div>
  );
};
