
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type CallRecord = {
  channel_name: string;
  start_time: string;
  end_time: string | null;
  participant_count: number;
};

export const CallHistory = () => {
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('quickpitch_call_history')
          .select('*')
          .order('start_time', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching call history:', error);
          toast.error('Failed to load call history');
          return;
        }

        console.log('Fetched call history:', data);
        setHistory(data || []);
      } catch (err) {
        console.error('Error in call history fetch:', err);
        toast.error('Failed to load call history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Recent Calls</h2>
        <div className="flex flex-col space-y-4 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Recent Calls</h2>
      <ScrollArea className="h-[300px]">
        {history.length === 0 ? (
          <div className="flex justify-center items-center h-[200px]">
            <p className="text-gray-500">No calls yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((call, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Room: {call.channel_name}</p>
                    <p className="text-sm text-gray-600">
                      Started: {format(new Date(call.start_time), 'MMM d, h:mm a')}
                    </p>
                    {call.end_time && (
                      <p className="text-sm text-gray-600">
                        Ended: {format(new Date(call.end_time), 'MMM d, h:mm a')}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {call.participant_count} participant{call.participant_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
