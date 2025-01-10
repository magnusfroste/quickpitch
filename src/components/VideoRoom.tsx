import AgoraUIKit from 'agora-react-uikit';
import 'agora-react-uikit/dist/index.css';
import { toast } from "sonner";

interface VideoRoomProps {
  channelName: string;
  onLeave: () => void;
}

const VideoRoom = ({ channelName, onLeave }: VideoRoomProps) => {
  const appId = "f57cb5af386a4ea595ad9668d9b522ac";
  
  const rtcProps = {
    appId: appId,
    channel: channelName,
    token: null, // Setting token to null since we're using App ID Authentication
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