import { useEffect, useState, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Presentation } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";

const appId = "f57cb5af386a4ea595ad9668d9b522ac";
const tempToken = "007eJxTYNh1qWMKg0Qqx3vDkDeva7mnJKUYzdp3c4KGauc1jUYe5VgFhjRT8+Qk08Q0YwuzRJPURFNL08QUSzMzixTLJFMjo8Rkk0mN6Q2BjAyLDG+yMjJAIIjPzpCTX5aYlJPKwAAAVwcfkg==";

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
  const localPlayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPresentationImages();
  }, []);

  const fetchPresentationImages = async () => {
    const { data, error } = await supabase
      .from('presentation_images')
      .select('*')
      .order('sort_order');

    if (error) {
      toast.error('Failed to fetch presentation images');
      return;
    }

    setPresentationImages(data || []);
  };

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

  let init = async (name: string) => {
    console.log("Initializing Agora client...");
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-left", handleUserLeft);

    try {
      console.log("Requesting media permissions...");
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

      console.log("Publishing tracks to channel...");
      await client.publish([audioTrack, videoTrack]);
      console.log("Tracks published successfully");
      
      if (videoTrack && localPlayerRef.current) {
        console.log("Playing local video track");
        // Clear any existing content and play
        localPlayerRef.current.innerHTML = '';
        videoTrack.play(localPlayerRef.current, { 
          fit: "cover",
          mirror: true 
        });
        console.log("Local video track playing in container");
      }
      
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
    }
  };

  init(channelName);

  useEffect(() => {
    return () => {
      console.log("Cleaning up...");
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
      console.log("Cleanup complete");
    };
  }, [channelName]);

  // Effect to handle video track updates
  useEffect(() => {
    if (localTracks.videoTrack && localPlayerRef.current && start) {
      localPlayerRef.current.innerHTML = '';
      localTracks.videoTrack.play(localPlayerRef.current, { 
        fit: "cover",
        mirror: true 
      });
    }
  }, [localTracks.videoTrack, start]);

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
    await client.leave();
    setStart(false);
    navigate('/dashboard'); // Changed from '/' to '/dashboard'
  };

  const togglePresentation = () => {
    setIsPresentationMode(!isPresentationMode);
    toast.success(isPresentationMode ? 'Presentation ended' : 'Presentation started');
  };

  return (
    <div className="h-screen bg-apple-gray p-4">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {start && localTracks.videoTrack && (
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg h-[300px]">
              <div ref={localPlayerRef} className="absolute inset-0 bg-gray-800"></div>
              <div className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                You
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
                    <div id={`player-${user.uid}`} className="absolute inset-0 bg-gray-800">
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

        {/* Presentation Images Section */}
        {isPresentationMode && (
          <div className="mb-4 bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Presentation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {presentationImages.map((image) => (
                <div key={image.id} className="relative aspect-video">
                  <img
                    src={image.image_url}
                    alt={`Presentation image ${image.id}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
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
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-12 h-12 bg-white"
            onClick={togglePresentation}
          >
            <Presentation className={`h-5 w-5 ${isPresentationMode ? 'text-apple-blue' : 'text-apple-text'}`} />
          </Button>
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
