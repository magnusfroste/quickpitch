import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ImageUploader";
import { ImageGrid } from "@/components/ImageGrid";
import { Copy, Share2, Video, Presentation } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isHost] = useState(true); // TODO: implement actual host check

  const getMeetingUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?meeting=lovable`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getMeetingUrl());
      toast.success("Meeting link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy meeting link");
    }
  };

  const shareMeeting = async () => {
    const meetingUrl = getMeetingUrl();
    const shareData = {
      title: "Join my video meeting",
      text: "Join my video meeting",
      url: meetingUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error("Web Share API not supported");
      }
    } catch (err) {
      copyToClipboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Meeting Dashboard</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Meeting Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Meeting Controls</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <Video className="h-4 w-4" />
                Join Meeting
              </Button>
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                onClick={shareMeeting}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              {isHost && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/presentation")}
                  className="flex items-center gap-2"
                >
                  <Presentation className="h-4 w-4" />
                  Start Presentation
                </Button>
              )}
            </div>
          </div>

          {/* Image Management */}
          {isHost && (
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Image Management</h2>
              <ImageUploader />
            </div>
          )}
        </div>

        {/* Image Grid */}
        {isHost && (
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Presentation Images</h2>
            <ImageGrid />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;