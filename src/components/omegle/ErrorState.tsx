interface ErrorStateProps {
  error: string;
  onGoBack: () => void;
  onRetry?: () => void;
}

export function ErrorState({ error, onGoBack, onRetry }: ErrorStateProps) {
  const isBackendDown = error.includes('Backend') || error.includes('unavailable') || error.includes('not responding') || error.includes('server');
  
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e8f4f8' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: isBackendDown ? '#fff3cd' : '#ffebee' }}
          >
            <svg 
              className="w-10 h-10" 
              style={{ color: isBackendDown ? '#ff9800' : '#f44336' }} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isBackendDown ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
            {isBackendDown ? 'Server Unavailable' : 'Connection Error'}
          </h2>
          
          <p className="text-gray-600 text-center mb-6">
            {error}
          </p>

          {isBackendDown && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 w-full">
              <p className="text-sm text-yellow-800 text-center">
                <strong>What to do:</strong><br/>
                • Check if the backend server is running<br/>
                • Verify the server URL in your environment<br/>
                • Contact the administrator if issue persists
              </p>
            </div>
          )}

          <div className="flex gap-3 w-full">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 py-3 px-6 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: '#4caf50' }}
              >
                Retry
              </button>
            )}
            <button
              onClick={onGoBack}
              className="flex-1 py-3 px-6 rounded-lg text-white font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: '#0084d1' }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
