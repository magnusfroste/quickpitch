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
        fit: "cover",
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
        ? 'h-[180px] w-full' 
        : 'aspect-video w-full max-w-4xl mx-auto'
    }`}>
      <div ref={playerRef} className="absolute inset-0" />
    </div>
  );
};