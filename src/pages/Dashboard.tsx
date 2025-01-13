import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MeetingControls } from "@/components/dashboard/MeetingControls";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { ImageManagement } from "@/components/dashboard/ImageManagement";
import { CallHistory } from "@/components/dashboard/CallHistory";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isHost] = useState(true);
  const [channelName, setChannelName] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleJoinMeeting = () => {
    navigate(`/meeting/${channelName}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleUploadSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Meeting Dashboard</h1>
          <div className="flex items-center gap-4">
            <UserMenu
              onSettingsClick={() => navigate("/settings")}
              onSignOut={handleSignOut}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <MeetingControls
              channelName={channelName}
              onChannelNameChange={setChannelName}
              onJoinMeeting={handleJoinMeeting}
            />
            <CallHistory />
          </div>
          
          {isHost && (
            <div className="space-y-8">
              <ImageManagement
                onUploadSuccess={handleUploadSuccess}
                refreshTrigger={refreshTrigger}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;