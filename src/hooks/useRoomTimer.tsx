import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type RoomTimer = {
  room_id: string;
  start_time: string | null;
  created_at: string | null;
};

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

  useEffect(() => {
    if (!channelName) return;

    const initializeTimer = async () => {
      try {
        console.log('Initializing timer for channel:', channelName, 'isHost:', isHost);
        // If host, check if timer exists, if not create it
        if (isHost) {
          const { data: existingTimer } = await supabase
            .from('room_timers')
            .select('start_time')
            .eq('room_id', channelName)
            .single();

          console.log('Existing timer:', existingTimer);

          if (!existingTimer) {
            console.log('Creating new timer for room:', channelName);
            const { error: insertError } = await supabase
              .from('room_timers')
              .insert([{ 
                room_id: channelName,
                start_time: null
              }]);

            if (insertError) {
              console.error('Error creating timer:', insertError);
              return;
            }
          }
        }

        // Subscribe to timer updates
        const channel = supabase.channel(`room_timer:${channelName}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'room_timers',
              filter: `room_id=eq.${channelName}`
            },
            (payload: RealtimePostgresChangesPayload<RoomTimer>) => {
              console.log('Timer update received:', payload);
              const newTimer = payload.new as RoomTimer;
              if (newTimer?.start_time) {
                console.log('Updating timer with start time:', newTimer.start_time);
                updateTimeLeft(newTimer.start_time);
              }
            }
          )
          .subscribe();

        // Get initial timer state
        const { data: timer, error } = await supabase
          .from('room_timers')
          .select('start_time')
          .eq('room_id', channelName)
          .single();

        if (error) {
          console.error('Error fetching timer:', error);
          return;
        }

        console.log('Initial timer state:', timer);
        if (timer?.start_time) {
          updateTimeLeft(timer.start_time);
        }

        return () => {
          if (timerInterval) {
            clearInterval(timerInterval);
          }
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Timer initialization error:', error);
      }
    };

    initializeTimer();
  }, [channelName, isHost]);

  // Effect to handle participant count changes
  useEffect(() => {
    console.log('Participant count changed:', participantCount, 'Previous count:', previousParticipantCount);
    
    const updateStartTime = async () => {
      if (!channelName) return;

      try {
        // Check if we're transitioning from 1 to 2 participants
        if (previousParticipantCount === 1 && participantCount >= 2) {
          console.log('Checking timer state for room:', channelName);
          // Check current timer state
          const { data: currentTimer } = await supabase
            .from('room_timers')
            .select('start_time')
            .eq('room_id', channelName)
            .single();

          console.log('Current timer state:', currentTimer);
          // Only update if timer hasn't started yet
          if (currentTimer && currentTimer.start_time === null) {
            console.log('Starting timer for room:', channelName);
            const { error: updateError } = await supabase
              .from('room_timers')
              .update({ start_time: new Date().toISOString() })
              .eq('room_id', channelName);

            if (updateError) {
              console.error('Error updating start time:', updateError);
            }
          }
        }
      } catch (error) {
        console.error('Error updating start time:', error);
      }
    };

    updateStartTime();
    setPreviousParticipantCount(participantCount);
  }, [participantCount, channelName, previousParticipantCount]);

  const updateTimeLeft = (startTime: string) => {
    console.log('Updating time left with start time:', startTime);
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    const interval = setInterval(() => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const duration = 20 * 60 * 1000; // 20 minutes in milliseconds
      const elapsed = now - start;
      const remaining = duration - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        clearInterval(interval);
        toast.error("Meeting time has expired!");
      } else {
        setTimeLeft(Math.floor(remaining / 1000));
        setIsExpired(false);
      }
    }, 1000);

    setTimerInterval(interval);
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft: formatTime(timeLeft),
    isExpired
  };
};