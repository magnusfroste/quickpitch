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
    <div className={`relative bg-white rounded-2xl overflow-hidden shadow-lg ${
      isPresentationMode 
        ? 'h-[180px] mb-2' 
        : 'h-[400px]'
    }`}>
      <div ref={playerRef} className="absolute inset-0"></div>
      <div className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
        {isLocal ? "You" : `User ${uid}`}
      </div>
    </div>
  );
};