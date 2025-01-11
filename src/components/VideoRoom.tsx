import { useEffect, useState, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Presentation, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";

const appId = "f57cb5af386a4ea595ad9668d9b522ac";
const tempToken = "007eJxTYOi+eHthToNTyMyzF4J87MveXpY97PbN60tOlOShXTtfm0xVYEgzNU9OMk1MM7YwSzRJTTS1NE1MsTQzs0ixTDI1MkpMPjuhKb0hkJGhe990ZkYGCATx2Rly8ssSk3JSGRgAlzoj8w==";

const client = AgoraRTC.createClient({ 
  mode: "rtc", 
  codec: "vp8",
  role: "host"
});

const VideoRoom = () => {
  const { channelName } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [start, setStart] = useState<boolean>(false);
  const [localTracks, setLocalTracks] = useState<{
    audioTrack: any;
    videoTrack: any;
  }>({ audioTrack: null, videoTrack: null });
  const [trackState, setTrackState] = useState({ video: true, audio: true });
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [presentationImages, setPresentationImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const localPlayerRef = useRef<HTMLDivElement>(null);
  const presenceChannel = useRef<any>(null);
  const [sharedState, setSharedState] = useState<{
    isPresentationMode: boolean;
    currentImageIndex: number;
    presenterUserId?: string;
  }>({
    isPresentationMode: false,
    currentImageIndex: 0
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const cleanup = async () => {
    console.log("Cleaning up...");
    
    // Clean up Agora client first
    client.removeAllListeners();
    if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
      try {
        await client.leave();
      } catch (err) {
        console.error("Error during client leave:", err);
      }
    }
    
    // Then clean up local tracks
    if (localTracks.audioTrack) {
      localTracks.audioTrack.stop();
      localTracks.audioTrack.close();
    }
    if (localTracks.videoTrack) {
      localTracks.videoTrack.stop();
      localTracks.videoTrack.close();
    }
    
    // Reset states
    setLocalTracks({ audioTrack: null, videoTrack: null });
    setStart(false);
    setUsers([]);
    
    // Clean up Supabase presence
    if (presenceChannel.current) {
      try {
        await presenceChannel.current.untrack();
        await supabase.removeChannel(presenceChannel.current);
      } catch (err) {
        console.error("Error during presence cleanup:", err);
      }
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      setIsHost(!!user);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!channelName) {
      toast.error("Invalid channel name");
      navigate('/dashboard');
      return;
    }

    const initializePresenceChannel = async () => {
      if (!isHost) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      presenceChannel.current = supabase.channel(`room:${channelName}`, {
        config: {
          presence: {
            key: user?.id,
          },
        },
      });

      presenceChannel.current
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.current.presenceState();
          console.log("Presence state updated:", state);
          
          const presenterState = Object.values(state).find((presences: any) => 
            presences.some((presence: any) => presence.isPresentationMode)
          );
          
          if (presenterState) {
            const presenter = presenterState[0];
            setSharedState({
              isPresentationMode: presenter.isPresentationMode,
              currentImageIndex: presenter.currentImageIndex,
              presenterUserId: presenter.userId
            });
            setIsPresentationMode(presenter.isPresentationMode);
            setCurrentImageIndex(presenter.currentImageIndex);
          } else {
            setSharedState({
              isPresentationMode: false,
              currentImageIndex: 0,
              presenterUserId: undefined
            });
            setIsPresentationMode(false);
            setCurrentImageIndex(0);
          }
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log("Successfully subscribed to presence channel");
            const { data: { user } } = await supabase.auth.getUser();
            await presenceChannel.current.track({
              isPresentationMode: false,
              currentImageIndex: 0,
              userId: user?.id
            });
          }
        });
    };

    const cleanup = async () => {
      console.log("Cleaning up...");
      
      // Clean up Agora client first
      client.removeAllListeners();
      if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
        try {
          await client.leave();
        } catch (err) {
          console.error("Error during client leave:", err);
        }
      }
      
      // Then clean up local tracks
      if (localTracks.audioTrack) {
        localTracks.audioTrack.stop();
        localTracks.audioTrack.close();
      }
      if (localTracks.videoTrack) {
        localTracks.videoTrack.stop();
        localTracks.videoTrack.close();
      }
      
      // Reset states
      setLocalTracks({ audioTrack: null, videoTrack: null });
      setStart(false);
      setUsers([]);
      
      // Clean up Supabase presence
      if (presenceChannel.current) {
        try {
          await presenceChannel.current.untrack();
          await supabase.removeChannel(presenceChannel.current);
        } catch (err) {
          console.error("Error during presence cleanup:", err);
        }
      }
    };

    const init = async (name: string) => {
      console.log("Requesting media permissions...");
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("Media permissions granted");
        
        console.log("Joining channel:", name);
        const uid = await client.join(appId, name, tempToken, null);
        console.log("Joined channel successfully. UID:", uid);
        
        console.log("Creating audio track...");
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "music_standard"
        });
        console.log("Audio track created");
        
        console.log("Creating video track...");
        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: {
            width: 640,
            height: 480,
            frameRate: 30,
            bitrateMin: 400,
            bitrateMax: 1000,
          },
          optimizationMode: "detail"
        });
        console.log("Video track created");

        if (videoTrack && localPlayerRef.current) {
          videoTrack.play(localPlayerRef.current);
        }

        console.log("Publishing tracks to channel...");
        await client.publish([audioTrack, videoTrack]);
        console.log("Tracks published successfully");

        setLocalTracks({ audioTrack, videoTrack });
        setStart(true);
        
        console.log("Setup complete");
      } catch (error) {
        console.error("Error during initialization:", error);
        if (error instanceof Error) {
          if (error.name === "NotAllowedError") {
            toast.error("Please allow camera and microphone access to join the meeting");
          } else {
            toast.error("Failed to join the meeting: " + error.message);
          }
        } else {
          toast.error("Failed to join the meeting");
        }
        if (isHost) {
          navigate('/dashboard');
        }
        throw error;
      }
    };

    const initializeAgora = async () => {
      try {
        console.log("Initializing Agora client...");
        
        // Set up event listeners
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-left", handleUserLeft);

        await init(channelName);
        
      } catch (error) {
        console.error("Error initializing Agora:", error);
        toast.error("Failed to initialize video conference");
        if (isHost) {
          navigate('/dashboard');
        }
      }
    };

    // Start initialization
    initializePresenceChannel();
    initializeAgora();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [channelName, isHost, navigate]);

  const handleUserPublished = async (user: any, mediaType: any) => {
    console.log("Remote user published:", user.uid, mediaType);
    await client.subscribe(user, mediaType);
    console.log("Subscribed to remote user:", user.uid, mediaType);
    
    if (mediaType === "video") {
      setUsers((prevUsers) => {
        console.log("Adding user to video grid:", user.uid);
        return [...prevUsers, user];
      });
    }
    if (mediaType === "audio") {
      console.log("Playing remote audio:", user.uid);
      user.audioTrack?.play();
    }
  };

  const handleUserUnpublished = (user: any, mediaType: any) => {
    console.log("Remote user unpublished:", user.uid, mediaType);
    if (mediaType === "audio") {
      user.audioTrack?.stop();
    }
    if (mediaType === "video") {
      setUsers((prevUsers) => {
        return prevUsers.filter((User) => User.uid !== user.uid);
      });
    }
  };

  const handleUserLeft = (user: any) => {
    console.log("Remote user left:", user.uid);
    setUsers((prevUsers) => {
      return prevUsers.filter((User) => User.uid !== user.uid);
    });
  };

  const mute = async (type: "audio" | "video") => {
    try {
      if (type === "audio") {
        if (!localTracks.audioTrack) {
          toast.error("Audio track not initialized");
          return;
        }
        await localTracks.audioTrack.setEnabled(!trackState.audio);
        setTrackState((ps) => ({
          ...ps,
          audio: !ps.audio,
        }));
      } else if (type === "video") {
        if (!localTracks.videoTrack) {
          toast.error("Video track not initialized");
          return;
        }
        await localTracks.videoTrack.setEnabled(!trackState.video);
        setTrackState((ps) => ({
          ...ps,
          video: !ps.video,
        }));
      }
    } catch (error) {
      console.error("Error toggling track:", error);
      toast.error(`Failed to ${trackState[type] ? "mute" : "unmute"} ${type}`);
    }
  };

  const leaveChannel = async () => {
    await cleanup();
    navigate('/dashboard');
  };

  const togglePresentation = async () => {
    if (!isHost) return; // Only hosts can toggle presentation mode
    
    const { data: { user } } = await supabase.auth.getUser();
    const newPresentationMode = !isPresentationMode;
    
    if (presenceChannel.current) {
      const trackData = {
        isPresentationMode: newPresentationMode,
        currentImageIndex,
        userId: user?.id
      };
      await presenceChannel.current.track(trackData);
    }
    
    setIsPresentationMode(newPresentationMode);
    toast.success(newPresentationMode ? 'Presentation started' : 'Presentation ended');
  };

  const nextImage = async () => {
    if (currentImageIndex < presentationImages.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (presenceChannel.current) {
        await presenceChannel.current.track({
          isPresentationMode: true,
          currentImageIndex: newIndex,
          userId: user?.id
        });
      }
    }
  };

  const previousImage = async () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (presenceChannel.current) {
        await presenceChannel.current.track({
          isPresentationMode: true,
          currentImageIndex: newIndex,
          userId: user?.id
        });
      }
    }
  };

  return (
    <div className="h-screen bg-apple-gray p-4">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        {isHost && (
          <div className="bg-black/10 p-2 mb-4 rounded text-sm">
            <p className="text-blue-600">Presentation Mode: {sharedState.isPresentationMode ? 'Active' : 'Inactive'}</p>
            <p className="text-green-600">Current Image Index: {sharedState.currentImageIndex}</p>
            <p className="text-purple-600">Presenter ID: {sharedState.presenterUserId || 'None'}</p>
            <p className="text-orange-600">Current User ID: {currentUserId || 'Not logged in'}</p>
            <p className="text-red-600">Is Presenter: {currentUserId === sharedState.presenterUserId ? 'Yes' : 'No'}</p>
          </div>
        )}

        {/* Video grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {start && localTracks.videoTrack && (
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg h-[300px]">
              <div ref={localPlayerRef} className="absolute inset-0"></div>
              <div className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                You {isHost ? '(Host)' : ''}
              </div>
            </div>
          )}
          {users.length > 0 &&
            users.map((user) => {
              if (user.videoTrack) {
                return (
                  <div
                    key={user.uid}
                    className="relative bg-white rounded-2xl overflow-hidden shadow-lg h-[300px]"
                  >
                    <div id={`player-${user.uid}`} className="absolute inset-0">
                      {user.videoTrack.play(`player-${user.uid}`)}
                    </div>
                    <div className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                      User {user.uid}
                    </div>
                  </div>
                );
              }
              return null;
            })}
        </div>

        {/* Presentation Image Section */}
        {sharedState.isPresentationMode && presentationImages.length > 0 && (
          <div className="mb-4 bg-white rounded-xl p-4 shadow-sm">
            <div className="relative">
              <img
                src={presentationImages[sharedState.currentImageIndex]?.image_url}
                alt={`Presentation image ${sharedState.currentImageIndex + 1}`}
                className="w-full h-[400px] object-contain rounded-lg"
              />
              {presentationImages.length > 1 && currentUserId === sharedState.presenterUserId && (
                <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-white/80 hover:bg-white"
                    onClick={previousImage}
                    disabled={sharedState.currentImageIndex === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-white/80 hover:bg-white"
                    onClick={nextImage}
                    disabled={sharedState.currentImageIndex === presentationImages.length - 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
              <div className="absolute bottom-4 right-4 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                {sharedState.currentImageIndex + 1} / {presentationImages.length}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4 pb-8">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-12 h-12 bg-white"
            onClick={() => mute("audio")}
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
            onClick={() => mute("video")}
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
              className="rounded-full w-12 h-12 bg-white"
              onClick={togglePresentation}
            >
              <Presentation className={`h-5 w-5 ${isPresentationMode ? 'text-apple-blue' : 'text-apple-text'}`} />
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={() => leaveChannel()}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;