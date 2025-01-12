import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { FeatureCards } from "@/components/landing/FeatureCards";

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <Header user={user} onLogout={handleLogout} />
        <Hero
          channelName={channelName}
          setChannelName={setChannelName}
          onJoinMeeting={joinMeeting}
          onHostMeeting={handleHostMeeting}
        />
        <FeatureCards />
      </div>
    </div>
  );
};

export default Index;