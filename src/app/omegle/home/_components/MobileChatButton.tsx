"use client";

interface MobileChatButtonProps {
  messageCount: number;
  onClick: () => void;
}

export default function MobileChatButton({ messageCount, onClick }: MobileChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed bottom-4 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-30 hover:bg-blue-700 transition-colors"
    >
      <span className="text-2xl">💬</span>
      {messageCount > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {messageCount > 9 ? "9+" : messageCount}
        </span>
      )}
    </button>
  );
}
