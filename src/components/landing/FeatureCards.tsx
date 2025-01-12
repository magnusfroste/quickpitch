import { Timer, Video, Shield } from "lucide-react";

export const FeatureCards = () => {
  return (
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
  );
};