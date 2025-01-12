import { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const appId = "f57cb5af386a4ea595ad9668d9b522ac";

const client = AgoraRTC.createClient({ 
  mode: "rtc", 
  codec: "vp8",
  role: "host"
});

export const useAgoraClient = (channelName: string | undefined) => {
  const [users, setUsers] = useState<any[]>([]);
  const [start, setStart] = useState<boolean>(false);
  const [localTracks, setLocalTracks] = useState<{
    audioTrack: any;
    videoTrack: any;
  }>({ audioTrack: null, videoTrack: null });
  const [trackState, setTrackState] = useState({ video: true, audio: true });

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
    if (!channelName) {
      toast.error("Invalid channel name");
      throw new Error("Invalid channel name");
    }

    try {
      const { token, uid } = await getAgoraToken();
      
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

      return { audioTrack, videoTrack };
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
      throw error;
    }
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

  useEffect(() => {
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-left", handleUserLeft);

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-left", handleUserLeft);
    };
  }, []);

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
  };

  return {
    users,
    start,
    localTracks,
    trackState,
    initializeAgora,
    mute,
    leaveChannel
  };
};