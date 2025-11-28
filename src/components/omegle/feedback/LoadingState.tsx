interface LoadingStateProps {
  state: string;
}

export function LoadingState({ state }: LoadingStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e8f4f8' }}>
      <div className="animate-pulse flex flex-col items-center">
        <div 
          className="h-12 w-12 border-4 border-t-transparent rounded-full animate-spin mb-4" 
          style={{ borderColor: '#0084d1' }}
        />
        <p className="text-slate-600 font-medium">
          {state === 'connecting' ? 'Connecting to server...' : 'Loading...'}
        </p>
      </div>
    </div>
  );
}
