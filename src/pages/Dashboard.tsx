
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MeetingControls } from "@/components/dashboard/MeetingControls";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { ImageManagement } from "@/components/dashboard/ImageManagement";
import { CallHistory } from "@/components/dashboard/CallHistory";
import { Layers, LayoutDashboard } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto">
        <header className="px-6 py-4 flex justify-between items-center bg-white shadow-sm rounded-b-xl">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">QuickPitch Dashboard</h1>
          </div>
          <UserMenu
            onSettingsClick={() => navigate("/settings")}
            onSignOut={handleSignOut}
          />
        </header>

        <main className="p-6 space-y-6">
          {/* First row: Start Your Pitch and Recent Pitches side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-sm text-white h-full">
                <div className="flex items-center gap-3 mb-4">
                  <Layers className="h-6 w-6" />
                  <h2 className="text-xl font-semibold">Start Your Pitch</h2>
                </div>
                <p className="mb-4 text-blue-100">
                  Create a meeting room and share your pitch slides with your audience.
                </p>
                <MeetingControls
                  channelName={channelName}
                  onChannelNameChange={setChannelName}
                  onJoinMeeting={handleJoinMeeting}
                />
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <CallHistory />
            </div>
          </div>
          
          {/* Second row: Pitch Presentation Manager with full width */}
          {isHost && (
            <div className="w-full">
              <ImageManagement
                onUploadSuccess={handleUploadSuccess}
                refreshTrigger={refreshTrigger}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
