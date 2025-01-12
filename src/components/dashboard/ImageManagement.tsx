import { ImageUploader } from "@/components/ImageUploader";
import { ImageGrid } from "@/components/ImageGrid";

interface ImageManagementProps {
  onUploadSuccess: () => void;
  refreshTrigger: number;
}

export const ImageManagement = ({ onUploadSuccess, refreshTrigger }: ImageManagementProps) => {
  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Image Management</h2>
        <ImageUploader onUploadSuccess={onUploadSuccess} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Presentation Images</h2>
        <ImageGrid key={refreshTrigger} />
      </div>
    </>
  );
};