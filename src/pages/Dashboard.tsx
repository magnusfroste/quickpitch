import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ImageUploader";
import { ImageGrid } from "@/components/ImageGrid";
import { Copy, Video, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isHost] = useState(true);
  const [channelName, setChannelName] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const getMeetingUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/meeting/${channelName}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getMeetingUrl());
      toast.success("Meeting link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy meeting link");
    }
  };

  const joinMeeting = () => {
    navigate(`/meeting/${channelName}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleUploadSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const isChannelNameValid = channelName.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Meeting Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" alt="Profile" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Meeting Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Meeting Controls</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="channel-name">Meeting Code</Label>
                <Input
                  id="channel-name"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Enter meeting code"
                  className="max-w-md"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={joinMeeting}
                  className="flex items-center gap-2"
                  disabled={!isChannelNameValid}
                >
                  <Video className="h-4 w-4" />
                  Start Meeting
                </Button>
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                  disabled={!isChannelNameValid}
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>

          {/* Image Management */}
          {isHost && (
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Image Management</h2>
              <ImageUploader onUploadSuccess={handleUploadSuccess} />
            </div>
          )}
        </div>

        {/* Image Grid */}
        {isHost && (
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Presentation Images</h2>
            <ImageGrid key={refreshTrigger} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;