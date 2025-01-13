import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRoomTimer = (
  channelName: string | undefined, 
  isHost: boolean,
  participantCount: number
) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [previousParticipantCount, setPreviousParticipantCount] = useState(participantCount);

  // Clear existing timer when channel changes
  useEffect(() => {
    console.log('Channel changed to:', channelName);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimeLeft(null);
    setIsExpired(false);
    setPreviousParticipantCount(1);
  }, [channelName]);

  // Effect to handle participant count changes
  useEffect(() => {
    if (!channelName) return;
    console.log('Participant count changed:', participantCount, 'Previous count:', previousParticipantCount);

    const startTimer = () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }

      const duration = 20 * 60; // 20 minutes in seconds
      setTimeLeft(duration);
      
      const interval = setInterval(() => {
        setTimeLeft((current) => {
          if (current === null) return null;
          if (current <= 0) {
            clearInterval(interval);
            setIsExpired(true);
            toast.error("Meeting time has expired!");
            return 0;
          }
          return current - 1;
        });
      }, 1000);

      setTimerInterval(interval);
    };

    const handleParticipantChange = async () => {
      try {
        // If transitioning from 1 to 2 participants
        if (previousParticipantCount === 1 && participantCount >= 2) {
          console.log('Starting timer for room:', channelName);
          
          if (isHost) {
            const { error: updateError } = await supabase
              .from('room_timers')
              .upsert({ 
                room_id: channelName,
                start_time: new Date().toISOString()
              });

            if (updateError) {
              console.error('Error updating start time:', updateError);
              return;
            }
          }
          
          // Start the timer for both host and client
          startTimer();
        }
      } catch (error) {
        console.error('Error handling participant change:', error);
      }
    };

    handleParticipantChange();
    setPreviousParticipantCount(participantCount);

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [participantCount, channelName, isHost, previousParticipantCount]);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return participantCount < 2 ? "Waiting for participants..." : "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft: formatTime(timeLeft),
    isExpired
  };
};