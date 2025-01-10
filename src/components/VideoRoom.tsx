import { useEffect, useState } from "react";
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";

const appId = "f57cb5af386a4ea595ad9668d9b522ac";
// Temporary token - in production this should come from your token server
const tempToken = "007eJxTYHgtMq9hd51lEd8zJolPF48+knvlsVo+/O3L2wfSRCp4jxQrMKSZmicnmSamGVuYJZqkJppamiamWJpZJlmaGSUmH+xvTG8IZGS480OHlZGBAkF8doac/LLEpJxUBgYAMNAi0w==";

// Create an instance of the Agora client
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

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
    // Handler for when a remote user publishes their stream
    const handleUserPublished = async (user: any, mediaType: any) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video") {
        setUsers((prevUsers) => {
          return [...prevUsers, user];
        });
      }
      if (mediaType === "audio") {
        user.audioTrack?.play();
      }
    };

    // Handler for when a remote user unpublishes their stream
    const handleUserUnpublished = (user: any, mediaType: any) => {
      if (mediaType === "audio") {
        user.audioTrack?.stop();
      }
      if (mediaType === "video") {
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
      }
    };

    // Handler for when a remote user leaves
    const handleUserLeft = (user: any) => {
      setUsers((prevUsers) => {
        return prevUsers.filter((User) => User.uid !== user.uid);
      });
    };

    let init = async (name: string) => {
      client.on("user-published", handleUserPublished);
      client.on("user-unpublished", handleUserUnpublished);
      client.on("user-left", handleUserLeft);

      try {
        // Request permissions before joining
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Join with token
        await client.join(appId, name, tempToken, null);
        
        // Create tracks with specific configurations
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
          }
        });

        await client.publish([audioTrack, videoTrack]);
        
        // Play local video track immediately after creation
        if (videoTrack) {
          videoTrack.play("local-video");
        }
        
        setLocalTracks({ audioTrack, videoTrack });
        setStart(true);
      } catch (error) {
        console.error("Error initializing streams:", error);
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
        console.log(err);
      });
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
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="absolute inset-0">
                <div className="w-full h-full" id="local-video"></div>
              </div>
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
                    className="relative bg-white rounded-2xl overflow-hidden shadow-lg"
                  >
                    <div className="absolute inset-0">
                      <div className="w-full h-full" id={`remote-video-${user.uid}`}></div>
                      {user.videoTrack.play(`remote-video-${user.uid}`)}
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
