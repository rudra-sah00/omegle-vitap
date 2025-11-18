"use client";

interface VideoControlsProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  networkQuality: 'excellent' | 'good' | 'poor' | 'bad';
  onMicToggle: () => void;
  onCameraToggle: () => void;
  onNext: () => void;
  onStop: () => void;
}

export default function VideoControls({
  isMicOn,
  isCameraOn,
  networkQuality,
  onMicToggle,
  onCameraToggle,
  onNext,
  onStop,
}: VideoControlsProps) {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2 md:p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={onMicToggle}
            className={
              "px-3 md:px-6 py-1.5 md:py-2 text-xs md:text-base rounded-lg font-semibold transition-colors " +
              (isMicOn
                ? "bg-white text-gray-900 hover:bg-gray-200"
                : "bg-red-600 text-white hover:bg-red-700")
            }
          >
            {isMicOn ? "🎤" : "🔇"}
            <span className="hidden md:inline ml-1">{isMicOn ? "Mute" : "Unmute"}</span>
          </button>

          <button
            onClick={onCameraToggle}
            className={
              "px-3 md:px-6 py-1.5 md:py-2 text-xs md:text-base rounded-lg font-semibold transition-colors " +
              (isCameraOn
                ? "bg-white text-gray-900 hover:bg-gray-200"
                : "bg-red-600 text-white hover:bg-red-700")
            }
          >
            {isCameraOn ? "📹" : "📷"}
            <span className="hidden md:inline ml-1">{isCameraOn ? "Stop" : "Start"}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Network quality indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${
              networkQuality === 'excellent' ? 'bg-green-500' :
              networkQuality === 'good' ? 'bg-yellow-500' :
              networkQuality === 'poor' ? 'bg-orange-500' : 'bg-red-500'
            }`}></div>
            <span className="text-white text-xs capitalize">{networkQuality}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="px-4 md:px-8 py-1.5 md:py-2 text-xs md:text-base rounded-lg font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors"
          >
            ⏭️ <span className="hidden md:inline">Next</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            className="px-4 md:px-8 py-1.5 md:py-2 text-xs md:text-base rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            ⏹️ <span className="hidden md:inline">Stop</span>
          </button>
        </div>
      </div>
    </div>
  );
}
