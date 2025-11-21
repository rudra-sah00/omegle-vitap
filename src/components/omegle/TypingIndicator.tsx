'use client';

export const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg max-w-fit">
      <span className="text-xs font-medium text-slate-600">Stranger is typing</span>
      <div className="flex gap-1">
        <div 
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ 
            backgroundColor: '#0084d1',
            animationDelay: '0ms',
            animationDuration: '1s'
          }}
        ></div>
        <div 
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ 
            backgroundColor: '#0084d1',
            animationDelay: '150ms',
            animationDuration: '1s'
          }}
        ></div>
        <div 
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ 
            backgroundColor: '#0084d1',
            animationDelay: '300ms',
            animationDuration: '1s'
          }}
        ></div>
      </div>
    </div>
  );
};
