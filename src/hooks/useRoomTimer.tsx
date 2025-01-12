import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useRoomTimer = (channelName: string | undefined, isHost: boolean) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

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
              .insert([
                { 
                  room_id: channelName,
                  start_time: new Date().toISOString()
                }
              ]);

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
            (payload) => {
              if (payload.new) {
                updateTimeLeft(payload.new.start_time);
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

        if (timer) {
          updateTimeLeft(timer.start_time);
        }

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Timer initialization error:', error);
      }
    };

    const updateTimeLeft = (startTime: string) => {
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

      return () => clearInterval(interval);
    };

    initializeTimer();
  }, [channelName, isHost]);

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