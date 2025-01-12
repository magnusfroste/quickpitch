import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Video, Users, Shield } from "lucide-react";

const Index = () => {
  const [channelName, setChannelName] = useState("");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check URL parameters for meeting code
    const urlParams = new URLSearchParams(window.location.search);
    const meetingCode = urlParams.get('meeting');
    if (meetingCode) {
      console.log("Found meeting code in URL:", meetingCode);
      setChannelName(meetingCode);
    }

    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Auth session:", session?.user ? "Logged in" : "Not logged in");
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleHostMeeting = () => {
    if (!user) {
      toast.error("Please login to host a meeting");
      navigate("/login");
      return;
    }
    navigate("/dashboard");
  };

  const joinMeeting = () => {
    if (!channelName) {
      toast.error("Please enter a meeting code");
      return;
    }
    console.log("Joining meeting with channel:", channelName);
    navigate(`/meeting/${channelName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Confablink
          </h1>
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/login");
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-5xl font-bold text-gray-900 leading-tight">
              Connect with anyone, anywhere, instantly
            </h2>
            <p className="text-xl text-gray-600">
              Start or join a secure video meeting with crystal-clear quality and easy-to-use features.
            </p>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Enter meeting code"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="text-lg p-6 rounded-xl"
              />
              <div className="flex gap-4">
                <Button
                  onClick={joinMeeting}
                  className="flex-1 h-12 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  Join Meeting
                </Button>
                <Button
                  variant="outline"
                  onClick={handleHostMeeting}
                  className="flex-1 h-12 text-lg"
                >
                  Host Meeting
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <img
                src="/placeholder.svg"
                alt="Video meeting illustration"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-xl">
              <Video className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">HD Video Calls</h3>
              <p className="text-gray-600">
                Crystal clear video quality for seamless communication.
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl">
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Group Meetings</h3>
              <p className="text-gray-600">
                Connect with multiple participants in one session.
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl">
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Calls</h3>
              <p className="text-gray-600">
                End-to-end encryption for your privacy and security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;