
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

// Array of possible avatar images for regeneration
const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Milo",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Jasper",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Ruby",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Max",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Luna",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Nova",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Leo"
];

const Settings = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | undefined>();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email);
      
      // Get avatar URL from user metadata
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    };

    getUser();
  }, []);

  const regenerateAvatar = async () => {
    setIsUpdating(true);
    try {
      // Select random avatar different from current one
      let newAvatarOptions = AVATAR_OPTIONS.filter(url => url !== avatarUrl);
      const newAvatarUrl = newAvatarOptions[Math.floor(Math.random() * newAvatarOptions.length)];
      
      // Update user metadata with new avatar
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: newAvatarUrl }
      });
      
      if (error) {
        throw error;
      }
      
      setAvatarUrl(newAvatarUrl);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Failed to update avatar");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || ""} alt="Profile" />
                  <AvatarFallback className="text-xl">
                    {email ? email.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={regenerateAvatar}
                  disabled={isUpdating}
                  className="flex items-center gap-2"
                >
                  {isUpdating ? "Updating..." : "New Avatar"}
                  <RefreshCw className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`} />
                </Button>
              </div>
              
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email address</h3>
                  <p className="mt-1 text-sm text-gray-900">{email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
