
interface EmptyStateProps {
  isAnalyzing: boolean;
}

export const EmptyState = ({ isAnalyzing }: EmptyStateProps) => {
  if (isAnalyzing) {
    return (
      <div className="text-center p-6 border rounded-lg bg-gray-50">
        <div className="flex justify-center mb-3">
          <div className="animate-spin h-6 w-6 border-3 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
        <p className="text-gray-500">
          Analyzing your images... This may take a minute or two.
        </p>
      </div>
    );
  }
  
  return (
    <div className="text-center p-6 border border-dashed rounded-lg bg-gray-50">
      <p className="text-gray-500">
        Click "Analyze Images" to get AI feedback on your pitch images
      </p>
      <p className="text-xs text-gray-400 mt-2">
        You must have at least one image uploaded
      </p>
    </div>
  );
};
