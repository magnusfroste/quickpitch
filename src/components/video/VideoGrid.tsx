import { VideoParticipant } from "./VideoParticipant";

interface VideoGridProps {
  start: boolean;
  localTracks: {
    videoTrack: any;
    audioTrack: any;
  };
  users: any[];
  isPresentationMode: boolean;
}

export const VideoGrid = ({ start, localTracks, users, isPresentationMode }: VideoGridProps) => {
  return (
    <div className={`${isPresentationMode ? 'w-1/4 h-full flex flex-col gap-2' : 'contents'}`}>
      {start && localTracks.videoTrack && (
        <VideoParticipant
          videoTrack={localTracks.videoTrack}
          audioTrack={localTracks.audioTrack}
          isLocal={true}
          isPresentationMode={isPresentationMode}
        />
      )}
      {users.map((user) => (
        user.videoTrack && (
          <VideoParticipant
            key={user.uid}
            uid={user.uid}
            videoTrack={user.videoTrack}
            audioTrack={user.audioTrack}
            isPresentationMode={isPresentationMode}
          />
        )
      ))}
    </div>
  );
};