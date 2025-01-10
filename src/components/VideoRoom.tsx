import { useEffect, useState } from "react";
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";

const appId = "f57cb5af386a4ea595ad9668d9b522ac";

// Create an instance of the Agora client
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

interface VideoRoomProps {
  channelName: string;
  onLeave?: () => void;
}

const VideoRoom = ({ channelName, onLeave }: VideoRoomProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [start, setStart] = useState<boolean>(false);
  const [localTracks, setLocalTracks] = useState<any[]>([]);
  const [trackState, setTrackState] = useState({ video: true, audio: true });

  useEffect(() => {
    let init = async (name: string) => {
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          setUsers((prevUsers) => {
            return [...prevUsers, user];
          });
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "audio") {
          user.audioTrack?.stop();
        }
        if (mediaType === "video") {
          setUsers((prevUsers) => {
            return prevUsers.filter((User) => User.uid !== user.uid);
          });
        }
      });

      client.on("user-left", (user) => {
        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });
      });

      try {
        await client.join(appId, name, null, null);
        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracksWithMediaOptions();
        await client.publish([microphoneTrack, cameraTrack]);
        setLocalTracks([microphoneTrack, cameraTrack]);
        setStart(true);
      } catch (error) {
        console.error(error);
        toast.error("Failed to join the meeting");
      }
    };

    init(channelName);

    return () => {
      for (let localTrack of localTracks) {
        localTrack.stop();
        localTrack.close();
      }
      client.off("user-published");
      client.off("user-unpublished");
      client.off("user-left");
      client.leave().catch((err) => {
        console.log(err);
      });
    };
  }, [channelName]);

  const mute = async (type: "audio" | "video") => {
    if (type === "audio") {
      await localTracks[0].setEnabled(!trackState.audio);
      setTrackState((ps) => {
        return { ...ps, audio: !ps.audio };
      });
    } else if (type === "video") {
      await localTracks[1].setEnabled(!trackState.video);
      setTrackState((ps) => {
        return { ...ps, video: !ps.video };
      });
    }
  };

  const leaveChannel = async () => {
    for (let localTrack of localTracks) {
      localTrack.stop();
      localTrack.close();
    }
    await client.leave();
    setStart(false);
    onLeave?.();
  };

  return (
    <div className="h-screen bg-apple-gray p-4">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {start && localTracks[1] && (
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="absolute inset-0">
                <div className="w-full h-full" id="local-video"></div>
                {localTracks[1].play("local-video")}
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