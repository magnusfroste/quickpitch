import { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const appId = "f57cb5af386a4ea595ad9668d9b522ac";

console.log("Initializing Agora client with mode: rtc, codec: vp8");
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
      console.log("Requesting Agora token for channel:", channelName);
      const { data, error } = await supabase.functions.invoke('generate-agora-token', {
        body: { channelName }
      });

      if (error) {
        console.error('Error getting Agora token:', error);
        throw new Error('Failed to get Agora token');
      }

      console.log("Successfully obtained Agora token");
      return data;
    } catch (error) {
      console.error('Error getting Agora token:', error);
      throw error;
    }
  };

  const initializeAgora = async () => {
    if (!channelName) {
      console.error("Channel name is undefined");
      toast.error("Invalid channel name");
      throw new Error("Invalid channel name");
    }

    try {
      console.log("Starting Agora initialization for channel:", channelName);
      const { token, uid } = await getAgoraToken();
      
      console.log("Joining channel with UID:", uid);
      await client.join(appId, channelName, token, uid);
      
      console.log("Creating audio track with music_standard encoding");
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: "music_standard"
      });
      
      console.log("Creating video track with optimized settings");
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

      console.log("Publishing tracks to channel");
      await client.publish([audioTrack, videoTrack]);

      setLocalTracks({ audioTrack, videoTrack });
      setStart(true);
      console.log("Successfully initialized and published local tracks");

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
    console.log("Setting up Agora event listeners");
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    client.on("user-left", handleUserLeft);

    return () => {
      console.log("Cleaning up Agora event listeners");
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
      client.off("user-left", handleUserLeft);
    };
  }, []);

  const mute = async (type: "audio" | "video") => {
    try {
      console.log(`Attempting to toggle ${type} track`);
      if (type === "audio") {
        if (!localTracks.audioTrack) {
          console.error("Audio track not initialized");
          toast.error("Audio track not initialized");
          return;
        }
        await localTracks.audioTrack.setEnabled(!trackState.audio);
        console.log(`Audio track ${trackState.audio ? 'muted' : 'unmuted'}`);
        setTrackState((ps) => ({
          ...ps,
          audio: !ps.audio,
        }));
      } else if (type === "video") {
        if (!localTracks.videoTrack) {
          console.error("Video track not initialized");
          toast.error("Video track not initialized");
          return;
        }
        await localTracks.videoTrack.setEnabled(!trackState.video);
        console.log(`Video track ${trackState.video ? 'stopped' : 'started'}`);
        setTrackState((ps) => ({
          ...ps,
          video: !ps.video,
        }));
      }
    } catch (error) {
      console.error(`Error toggling ${type} track:`, error);
      toast.error(`Failed to ${trackState[type] ? "mute" : "unmute"} ${type}`);
    }
  };

  const leaveChannel = async () => {
    console.log("Leaving channel and cleaning up resources");
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
    console.log("Successfully left channel and cleaned up");
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