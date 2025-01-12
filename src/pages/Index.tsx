import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Timer, Video, Shield } from "lucide-react";

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

    // Initialize authentication state
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Session error:", sessionError);
          // If there's a session error, clear the session and redirect to login
          await supabase.auth.signOut();
          navigate("/login");
          return;
        }
        
        console.log("Auth session:", session?.user ? "Logged in" : "Not logged in");
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Auth initialization error:", error);
        navigate("/login");
      }
    };

    initAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate("/login");
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            QuickPitch
          </h1>
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                  navigate("/login");
                } catch (error) {
                  console.error("Logout error:", error);
                  toast.error("Failed to log out. Please try again.");
                }
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                Your pitch. 5 slides.<br />
                20 minutes. Done.
              </h2>
              <p className="text-xl text-gray-600">
                Get straight to the point with our time-boxed format.
                Show respect for your prospect's time, and they'll respect your pitch.
              </p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Enter meeting code"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="text-lg p-6 rounded-xl border-gray-300"
              />
              <div className="flex gap-4">
                <Button
                  onClick={joinMeeting}
                  className="flex-1 h-12 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  Join Pitch
                </Button>
                <Button
                  variant="outline"
                  onClick={handleHostMeeting}
                  className="flex-1 h-12 text-lg border-2"
                >
                  Start Pitching
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden transform translate-x-4">
              <img
                src="/lovable-uploads/48ecab87-1aa6-4b3f-9b40-995e3d15ef3e.png"
                alt="Person working with tablet"
                className="w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-blue-50 p-8 rounded-xl">
            <Timer className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">20-Minute Timer</h3>
            <p className="text-gray-600">
              Time is money. We'll keep you on track with our built-in timer.
            </p>
          </div>
          <div className="bg-blue-50 p-8 rounded-xl">
            <Video className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">5-Slide Limit</h3>
            <p className="text-gray-600">
              Keep your pitch focused and respect everyone's time.
            </p>
          </div>
          <div className="bg-blue-50 p-8 rounded-xl">
            <Shield className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure Sharing</h3>
            <p className="text-gray-600">
              Share your pitch with confidence using encryption in transit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;