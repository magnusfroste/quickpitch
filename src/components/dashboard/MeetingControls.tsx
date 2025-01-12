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
    <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Meeting Controls</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="channel-name">Meeting Code</Label>
          <Input
            id="channel-name"
            value={channelName}
            onChange={(e) => onChannelNameChange(e.target.value)}
            placeholder="Enter meeting code"
            className="max-w-md"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onJoinMeeting}
            className="flex items-center gap-2"
            disabled={!isChannelNameValid}
          >
            <Video className="h-4 w-4" />
            Start Meeting
          </Button>
          <Button
            variant="outline"
            onClick={copyToClipboard}
            className="flex items-center gap-2"
            disabled={!isChannelNameValid}
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>
        </div>
      </div>
    </div>
  );
};