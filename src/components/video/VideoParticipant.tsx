import { useEffect, useRef } from "react";

interface VideoParticipantProps {
  uid?: string;
  videoTrack: any;
  audioTrack?: any;
  isLocal?: boolean;
  isPresentationMode?: boolean;
}

export const VideoParticipant = ({ 
  uid, 
  videoTrack, 
  audioTrack, 
  isLocal = false,
  isPresentationMode = false 
}: VideoParticipantProps) => {
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoTrack && playerRef.current) {
      console.log(`Playing ${isLocal ? 'local' : 'remote'} video for user:`, uid);
      playerRef.current.innerHTML = '';
      videoTrack.play(playerRef.current, { 
        fit: "cover", // Changed from "contain" to "cover" to fill the frame
        mirror: isLocal 
      });
    }
    
    if (audioTrack && !isLocal) {
      console.log("Playing remote audio for user:", uid);
      audioTrack.play();
    }

    return () => {
      if (videoTrack) {
        videoTrack.stop();
      }
      if (audioTrack && !isLocal) {
        audioTrack.stop();
      }
    };
  }, [videoTrack, audioTrack, isLocal, uid]);

  return (
    <div className={`relative bg-black rounded-2xl overflow-hidden ${
      isPresentationMode 
        ? 'h-[180px] w-full' // Adjusted to maintain aspect ratio in presentation mode
        : 'aspect-video w-full max-w-4xl mx-auto' // Using aspect-video for 16:9 ratio in normal mode
    }`}>
      <div ref={playerRef} className="absolute inset-0 flex items-center justify-center" />
      <div className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
        {isLocal ? "You" : `User ${uid}`}
      </div>
    </div>
  );
};