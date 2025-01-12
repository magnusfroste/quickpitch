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
    <div className={`${isPresentationMode ? 'w-1/4 flex flex-col gap-4' : 'contents'}`}>
      {isPresentationMode ? (
        // In presentation mode, show remote users first, then local user
        <>
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
          {start && localTracks.videoTrack && (
            <VideoParticipant
              videoTrack={localTracks.videoTrack}
              audioTrack={localTracks.audioTrack}
              isLocal={true}
              isPresentationMode={isPresentationMode}
            />
          )}
        </>
      ) : (
        // In normal mode, show local user first, then remote users
        <>
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
        </>
      )}
    </div>
  );
};