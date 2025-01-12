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
  console.log("Rendering VideoRoom component");
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
      console.log("Getting current user information");
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      setIsHost(!!user?.id);
      console.log("Current user:", user?.id ? "Authenticated" : "Not authenticated");
    };
    getCurrentUser();

    if (!channelName) {
      console.error("No channel name provided");
      toast.error("Invalid channel name");
      navigate('/dashboard');
      return;
    }

    console.log("Initializing Agora client");
    initializeAgora().catch((err) => {
      console.error("Failed to initialize Agora:", err);
      navigate('/dashboard');
    });

    return () => {
      console.log("Cleaning up VideoRoom component");
      leaveChannel().catch((err) => {
        console.error("Error leaving channel:", err);
      });
    };
  }, [channelName, navigate]);

  const handleLeave = async () => {
    console.log("Handling leave channel request");
    await leaveChannel();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
    console.log("Successfully left channel");
  };

  return (
    <div className="h-screen bg-apple-gray p-4">
      <div className="max-w-[1800px] mx-auto h-full flex flex-col">
        <div className={`flex-1 ${sharedState.isPresentationMode ? 'flex gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'} mb-4`}>
          <div className={`${sharedState.isPresentationMode ? 'w-1/4 flex flex-col gap-4' : 'contents'}`}>
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
            <div className="flex-1">
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