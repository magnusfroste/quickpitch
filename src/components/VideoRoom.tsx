import AgoraUIKit from 'agora-react-uikit';
import 'agora-react-uikit/dist/index.css';
import { toast } from "sonner";

interface VideoRoomProps {
  channelName: string;
  onLeave: () => void;
}

const VideoRoom = ({ channelName, onLeave }: VideoRoomProps) => {
  const appId = "f57cb5af386a4ea595ad9668d9b522ac";
  // Using the provided token for the "lovable" channel
  const token = "007eJxTYNh1qWMKg0Qqx3vDkDeva7mnJKUYzdp3c4KGauc1jUYe5VgFhjRT8+Qk08Q0YwuzRJPURFNL08QUSzMzixTLJFMjo8Rkk0mN6Q2BjAyLDG+yMjJAIIjPzpCTX5aYlJPKwAAAVwcfkg==";
  
  const rtcProps = {
    appId: appId,
    channel: channelName,
    token: token,
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