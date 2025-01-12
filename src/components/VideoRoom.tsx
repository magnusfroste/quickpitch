import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VideoParticipant } from "./video/VideoParticipant";
import { PresentationView } from "./video/PresentationView";
import { ControlBar } from "./video/ControlBar";
import { useAgoraClient } from "@/hooks/useAgoraClient";
import { usePresentation } from "@/hooks/usePresentation";

const VideoRoom = () => {
  const { channelName } = useParams();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const {
    users,
    start,
    localTracks,
    trackState,
    initializeAgora,
    mute,
    leaveChannel
  } = useAgoraClient(channelName);

  const {
    isPresentationMode,
    presentationImages,
    currentImageIndex,
    sharedState,
    togglePresentation,
    nextImage,
    previousImage
  } = usePresentation(channelName, currentUserId);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      setIsHost(!!user?.id);
    };
    getCurrentUser();

    if (!channelName) {
      toast.error("Invalid channel name");
      navigate('/dashboard');
      return;
    }

    initializeAgora().catch(() => {
      navigate('/dashboard');
    });

    return () => {
      leaveChannel().catch((err) => {
        console.error("Error leaving channel:", err);
      });
    };
  }, [channelName, navigate]);

  const handleLeave = async () => {
    await leaveChannel();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="h-screen bg-apple-gray p-4">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {start && localTracks.videoTrack && (
            <VideoParticipant
              videoTrack={localTracks.videoTrack}
              audioTrack={localTracks.audioTrack}
              isLocal={true}
            />
          )}
          {users.map((user) => (
            user.videoTrack && (
              <VideoParticipant
                key={user.uid}
                uid={user.uid}
                videoTrack={user.videoTrack}
                audioTrack={user.audioTrack}
              />
            )
          ))}
        </div>

        {sharedState.isPresentationMode && presentationImages.length > 0 && (
          <PresentationView
            images={presentationImages}
            currentIndex={sharedState.currentImageIndex}
            isPresenter={currentUserId === sharedState.presenterUserId}
            onPrevious={previousImage}
            onNext={nextImage}
          />
        )}

        <ControlBar
          isHost={isHost}
          trackState={trackState}
          isPresentationMode={isPresentationMode}
          onMute={mute}
          onTogglePresentation={togglePresentation}
          onLeave={handleLeave}
        />
      </div>
    </div>
  );
};

export default VideoRoom;