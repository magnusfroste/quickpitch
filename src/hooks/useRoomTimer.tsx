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

  useEffect(() => {
    if (!channelName) return;

    const initializeTimer = async () => {
      try {
        // If host, check if timer exists, if not create it
        if (isHost) {
          const { data: existingTimer } = await supabase
            .from('room_timers')
            .select('start_time')
            .eq('room_id', channelName)
            .single();

          if (!existingTimer) {
            const { error: insertError } = await supabase
              .from('room_timers')
              .insert([{ 
                room_id: channelName,
                start_time: null // Initially set to null
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
              const newTimer = payload.new as RoomTimer;
              if (newTimer?.start_time) {
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

        const timerData = timer as RoomTimer;
        if (timerData?.start_time) {
          updateTimeLeft(timerData.start_time);
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
    const updateStartTime = async () => {
      if (!channelName || !isHost) return;

      try {
        if (participantCount >= 2) {
          // Start the timer only if it hasn't been started yet
          const { data: currentTimer } = await supabase
            .from('room_timers')
            .select('start_time')
            .eq('room_id', channelName)
            .single();

          if (currentTimer && !currentTimer.start_time) {
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
  }, [participantCount, channelName, isHost]);

  const updateTimeLeft = (startTime: string) => {
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