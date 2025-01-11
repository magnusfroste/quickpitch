import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Settings from "@/pages/Settings";
import Index from "@/pages/Index";
import VideoRoom from "@/components/VideoRoom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/meeting/:channelName" element={<VideoRoom />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;