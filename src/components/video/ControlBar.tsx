import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Presentation } from "lucide-react";

interface ControlBarProps {
  isHost: boolean;
  trackState: {
    audio: boolean;
    video: boolean;
  };
  isPresentationMode: boolean;
  onMute: (type: "audio" | "video") => void;
  onTogglePresentation: () => void;
  onLeave: () => void;
}

export const ControlBar = ({
  isHost,
  trackState,
  isPresentationMode,
  onMute,
  onTogglePresentation,
  onLeave
}: ControlBarProps) => {
  return (
    <div className="flex justify-center gap-4 pb-8">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 bg-white"
        onClick={() => onMute("audio")}
      >
        {trackState.audio ? (
          <Mic className="h-5 w-5 text-apple-text" />
        ) : (
          <MicOff className="h-5 w-5 text-red-500" />
        )}
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 bg-white"
        onClick={() => onMute("video")}
      >
        {trackState.video ? (
          <Video className="h-5 w-5 text-apple-text" />
        ) : (
          <VideoOff className="h-5 w-5 text-red-500" />
        )}
      </Button>
      {isHost && (
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full w-12 h-12 ${isPresentationMode ? 'bg-[#ea384c] hover:bg-[#ea384c]/90' : 'bg-white'}`}
          onClick={onTogglePresentation}
        >
          <Presentation className={`h-5 w-5 ${isPresentationMode ? 'text-white' : 'text-apple-text'}`} />
        </Button>
      )}
      <Button
        variant="destructive"
        size="icon"
        className="rounded-full w-12 h-12"
        onClick={onLeave}
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
};