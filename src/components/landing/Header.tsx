import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface HeaderProps {
  user: any;
  onLogout: () => Promise<void>;
}

export const Header = ({ user, onLogout }: HeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-12">
      <h1 className="text-3xl font-bold text-gray-900">
        QuickPitch
      </h1>
      {user && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className="text-gray-500 hover:text-gray-700"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};