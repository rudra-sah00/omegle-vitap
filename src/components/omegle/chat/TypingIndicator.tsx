'use client';

export const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500 italic">typing</span>
      <div className="flex gap-1">
        <div 
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ 
            backgroundColor: '#64748b',
            animationDelay: '0ms',
            animationDuration: '1s'
          }}
        ></div>
        <div 
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ 
            backgroundColor: '#64748b',
            animationDelay: '150ms',
            animationDuration: '1s'
          }}
        ></div>
        <div 
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ 
            backgroundColor: '#64748b',
            animationDelay: '300ms',
            animationDuration: '1s'
          }}
        ></div>
      </div>
    </div>
  );
};
