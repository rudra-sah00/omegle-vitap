interface ErrorStateProps {
  error: string;
  onGoBack: () => void;
}

export function ErrorState({ error, onGoBack }: ErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e8f4f8' }}>
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-600 font-medium">Connection Error</p>
        <p className="text-slate-500 text-sm">{error}</p>
        <button
          onClick={onGoBack}
          className="px-6 py-2 rounded-lg text-white font-medium transition-colors"
          style={{ backgroundColor: '#0084d1' }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
