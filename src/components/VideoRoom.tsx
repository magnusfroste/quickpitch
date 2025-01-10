import AgoraUIKit from 'agora-react-uikit';
import 'agora-react-uikit/dist/index.css';
import { toast } from "sonner";

interface VideoRoomProps {
  channelName: string;
  onLeave: () => void;
}

const VideoRoom = ({ channelName, onLeave }: VideoRoomProps) => {
  const appId = "f57cb5af386a4ea595ad9668d9b522ac";
  // Using a temporary token for the "lovable" channel
  const token = "007eJxTYPjzMuGQ5pGZvxgWKt1/9/vBm4eP5+1YLLbmxMGtR7Yd+2GroMCQbGFpYWJqYZyUZGFhYZqcZGxpaWaQmGRgYWGWmGz6+ldKQyAjw+1tP5kYGSAQxGdhKEktLmFgAACumB+U";
  
  const rtcProps = {
    appId: appId,
    channel: channelName,
    token: token, // Using the temporary token
    enableScreensharing: true,
  };

  const callbacks = {
    EndCall: () => {
      toast.success("Call ended");
      onLeave();
    },
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      <AgoraUIKit rtcProps={rtcProps} callbacks={callbacks} />
    </div>
  );
};

export default VideoRoom;