import { useEffect, useState, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Presentation, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { MeetingTimer } from "./MeetingTimer";

// Remove hardcoded app ID and use environment variable
const appId = import.meta.env.VITE_AGORA_APP_ID;

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
  const [meetingStartTime, setMeetingStartTime] = useState<number>(0);
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
  const userVideoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
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

  useEffect(() => {
    if (!channelName) {
      toast.error("Invalid channel name");
      navigate('/dashboard');
      return;
    }

    const initializePresenceChannel = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const channelId = `room:${channelName}`;
      presenceChannel.current = supabase.channel(channelId, {
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
            const { data: { user } } = await supabase.auth.getUser();
            await presenceChannel.current.track({
              isPresentationMode: false,
              currentImageIndex: 0,
              userId: user?.id
            });
          }
        });
    };

    const getAgoraToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-agora-token', {
          body: { channelName }
        });

        if (error) {
          console.error('Error getting Agora token:', error);
          throw new Error('Failed to get Agora token');
        }

        return data;
      } catch (error) {
        console.error('Error getting Agora token:', error);
        throw error;
      }
    };

    const initializeAgora = async () => {
      try {
        const { token, uid } = await getAgoraToken();
        
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-left", handleUserLeft);
        
        await client.join(appId, channelName, token, uid);
        
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "music_standard"
        });
        
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

        await client.publish([audioTrack, videoTrack]);

        setLocalTracks({ audioTrack, videoTrack });
        setStart(true);
        setMeetingStartTime(Date.now());
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
        navigate('/dashboard');
      }
    };

    initializePresenceChannel();
    initializeAgora();

    return () => {
      if (localTracks.audioTrack) {
        localTracks.audioTrack.stop();
        localTracks.audioTrack.close();
      }
      if (localTracks.videoTrack) {
        localTracks.videoTrack.stop();
        localTracks.videoTrack.close();
      }
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-left", handleUserLeft);
      client.leave().catch((err) => {
        console.error("Error leaving channel:", err);
      });
      if (presenceChannel.current) {
        presenceChannel.current.untrack();
        supabase.removeChannel(presenceChannel.current);
      }
      // Clean up video containers
      Object.keys(userVideoRefs.current).forEach(uid => {
        if (userVideoRefs.current[uid]) {
          userVideoRefs.current[uid]!.innerHTML = '';
        }
      });
    };
  }, [channelName]);

  useEffect(() => {
    fetchPresentationImages();
  }, []);

  useEffect(() => {
    if (localTracks.videoTrack && localPlayerRef.current && start) {
      console.log("Updating local video display");
      localPlayerRef.current.innerHTML = '';
      localTracks.videoTrack.play(localPlayerRef.current, { 
        fit: "cover",
        mirror: true 
      });
    }
  }, [localTracks.videoTrack, start]);

  const handleUserPublished = async (user: any, mediaType: any) => {
    console.log("Remote user published:", user.uid, mediaType);
    
    try {
      await client.subscribe(user, mediaType);
      console.log("Subscribed to remote user:", user.uid, mediaType);
      
      if (mediaType === "video") {
        setUsers(prevUsers => {
          // Only add the user if they're not already in the list
          if (!prevUsers.find(u => u.uid === user.uid)) {
            console.log("Adding user to video grid:", user.uid);
            return [...prevUsers, user];
          }
          return prevUsers;
        });

        // Ensure we have a container for this user's video
        if (!userVideoRefs.current[user.uid]) {
          userVideoRefs.current[user.uid] = document.createElement('div');
        }

        // Clear the container before playing
        if (userVideoRefs.current[user.uid]) {
          userVideoRefs.current[user.uid]!.innerHTML = '';
          console.log("Playing remote video for user:", user.uid);
          user.videoTrack?.play(userVideoRefs.current[user.uid]);
        }
      }
      
      if (mediaType === "audio") {
        console.log("Playing remote audio:", user.uid);
        user.audioTrack?.play();
      }
    } catch (error) {
      console.error("Error handling user published:", error);
    }
  };

  const handleUserUnpublished = (user: any, mediaType: any) => {
    console.log("Remote user unpublished:", user.uid, mediaType);
    if (mediaType === "audio") {
      if (user.audioTrack) {
        user.audioTrack.stop();
      }
    }
    if (mediaType === "video") {
      // Clear the video container
      if (userVideoRefs.current[user.uid]) {
        userVideoRefs.current[user.uid]!.innerHTML = '';
      }
      setUsers((prevUsers) => {
        return prevUsers.filter((User) => User.uid !== user.uid);
      });
    }
  };

  const handleUserLeft = (user: any) => {
    console.log("Remote user left:", user.uid);
    // Clear the video container
    if (userVideoRefs.current[user.uid]) {
      userVideoRefs.current[user.uid]!.innerHTML = '';
      delete userVideoRefs.current[user.uid];
    }
    setUsers((prevUsers) => {
      return prevUsers.filter((User) => User.uid !== user.uid);
    });
  };

  const fetchPresentationImages = async () => {
    console.log('Fetching presentation images...');
    const { data, error } = await supabase
      .from('presentation_images')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error fetching presentation images:', error);
      toast.error('Failed to fetch presentation images');
      return;
    }

    console.log('Fetched presentation images:', data);
    setPresentationImages(data || []);
  };

  const handleTimeUp = () => {
    toast.warning("Meeting time limit reached (20 minutes)");
    leaveChannel();
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
    if (localTracks.audioTrack) {
      localTracks.audioTrack.stop();
      localTracks.audioTrack.close();
    }
    if (localTracks.videoTrack) {
      localTracks.videoTrack.stop();
      localTracks.videoTrack.close();
    }
    
    // Clean up all video containers
    Object.keys(userVideoRefs.current).forEach(uid => {
      if (userVideoRefs.current[uid]) {
        userVideoRefs.current[uid]!.innerHTML = '';
      }
    });
    
    await client.leave();
    setStart(false);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const togglePresentation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const newPresentationMode = !isPresentationMode;
    
    if (presenceChannel.current) {
      await presenceChannel.current.track({
        isPresentationMode: newPresentationMode,
        currentImageIndex,
        userId: user?.id
      });
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Meeting Room: {channelName}</h2>
          {start && meetingStartTime > 0 && (
            <MeetingTimer 
              startTime={meetingStartTime} 
              onTimeUp={handleTimeUp}
            />
          )}
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {start && localTracks.videoTrack && (
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg h-[300px]">
              <div ref={localPlayerRef} className="absolute inset-0"></div>
              <div className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                You
              </div>
            </div>
          )}
          {users.map((user) => (
            <div
              key={user.uid}
              className="relative bg-white rounded-2xl overflow-hidden shadow-lg h-[300px]"
            >
              <div
                ref={el => userVideoRefs.current[user.uid] = el}
                className="absolute inset-0"
              />
              <div className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                User {user.uid}
              </div>
            </div>
          ))}
        </div>

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