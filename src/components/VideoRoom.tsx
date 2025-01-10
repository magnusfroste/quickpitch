import { useEffect, useState } from "react";
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";

const appId = "f57cb5af386a4ea595ad9668d9b522ac";
const tempToken = "007eJxTYNh1qWMKg0Qqx3vDkDeva7mnJKUYzdp3c4KGauc1jUYe5VgFhjRT8+Qk08Q0YwuzRJPURFNL08QUSzMzixTLJFMjo8Rkk0mN6Q2BjAyLDG+yMjJAIIjPzpCTX5aYlJPKwAAAVwcfkg==";

const client = AgoraRTC.createClient({ 
  mode: "rtc", 
  codec: "vp8",
  role: "host"
});

interface VideoRoomProps {
  channelName: string;
  onLeave?: () => void;
}

const VideoRoom = ({ channelName, onLeave }: VideoRoomProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [start, setStart] = useState<boolean>(false);
  const [localTracks, setLocalTracks] = useState<{
    audioTrack: any;
    videoTrack: any;
  }>({ audioTrack: null, videoTrack: null });
  const [trackState, setTrackState] = useState({ video: true, audio: true });

  useEffect(() => {
    if (channelName !== "lovable") {
      toast.error("Invalid channel. Please use 'lovable' as the meeting code.");
      onLeave?.();
      return;
    }

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
        const uid = await client.join(appId, "lovable", tempToken, null);
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
          }
        });
        console.log("Video track created");

        console.log("Publishing tracks to channel...");
        await client.publish([audioTrack, videoTrack]);
        console.log("Tracks published successfully");
        
        if (videoTrack) {
          console.log("Playing local video track");
          const localPlayerContainer = document.createElement('div');
          localPlayerContainer.id = `player-${uid}`;
          localPlayerContainer.style.width = '100%';
          localPlayerContainer.style.height = '100%';
          document.getElementById('local-player')?.appendChild(localPlayerContainer);
          videoTrack.play(localPlayerContainer.id);
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
    onLeave?.();
  };

  return (
    <div className="h-screen bg-apple-gray p-4">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {start && localTracks.videoTrack && (
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg h-[300px]">
              <div id="local-player" className="absolute inset-0"></div>
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