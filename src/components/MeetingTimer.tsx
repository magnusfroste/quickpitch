import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface MeetingTimerProps {
  startTime: number;
  onTimeUp: () => void;
}

const MEETING_DURATION = 20 * 60; // 20 minutes in seconds

export const MeetingTimer = ({ startTime, onTimeUp }: MeetingTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(MEETING_DURATION);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = MEETING_DURATION - elapsed;
      
      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp();
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const getTimerColor = () => {
    if (timeLeft <= 60) return "destructive"; // Last minute
    if (timeLeft <= 300) return "warning"; // Last 5 minutes
    return "secondary";
  };

  return (
    <Badge variant={getTimerColor()} className="flex items-center gap-1">
      <Clock className="h-4 w-4" />
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </Badge>
  );
};