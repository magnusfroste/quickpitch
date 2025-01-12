import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VideoGrid } from "./video/VideoGrid";
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

    initializeAgora().catch((err) => {
      console.error("Failed to initialize Agora:", err);
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
    navigate(user ? '/dashboard' : '/');
  };

  return (
    <div className="h-screen bg-apple-gray">
      <div className="h-full flex flex-col">
        <div className={`flex-1 ${sharedState.isPresentationMode ? 'flex items-start gap-2 p-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4'}`}>
          <VideoGrid
            start={start}
            localTracks={localTracks}
            users={users}
            isPresentationMode={sharedState.isPresentationMode}
          />

          {sharedState.isPresentationMode && presentationImages.length > 0 && (
            <div className="flex-1 h-full">
              <PresentationView
                images={presentationImages}
                currentIndex={sharedState.currentImageIndex}
                isPresenter={currentUserId === sharedState.presenterUserId}
                onPrevious={previousImage}
                onNext={nextImage}
              />
            </div>
          )}
        </div>

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