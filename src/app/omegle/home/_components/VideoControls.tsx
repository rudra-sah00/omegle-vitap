"use client";

interface VideoControlsProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  networkQuality: 'excellent' | 'good' | 'poor' | 'bad';
  onMicToggle: () => void;
  onCameraToggle: () => void;
  onNext: () => void;
  onStop: () => void;
  showControls: boolean;
}

export default function VideoControls({
  isMicOn,
  isCameraOn,
  networkQuality,
  onMicToggle,
  onCameraToggle,
  onNext,
  onStop,
  showControls,
}: VideoControlsProps) {
  if (!showControls) return null;

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-10">
      {/* Camera */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCameraToggle();
        }}
        className={`p-3 rounded-full shadow-lg transition-all ${
          isCameraOn
            ? "bg-white text-gray-900 hover:bg-gray-100"
            : "bg-red-600 text-white hover:bg-red-700"
        }`}
        title={isCameraOn ? "Turn off camera" : "Turn on camera"}
      >
        {isCameraOn ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894l-2 1A1 1 0 0014 8v.586l-2-2V6a2 2 0 00-2-2H7.414l-3.707-3.707zM2 6a2 2 0 012-2h.586L2 1.414V6zm10 8.586l-2-2V14a2 2 0 01-2 2H4a2 2 0 01-2-2v-2.586L10 8.586V14.586z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Microphone */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMicToggle();
        }}
        className={`p-3 rounded-full shadow-lg transition-all ${
          isMicOn
            ? "bg-white text-gray-900 hover:bg-gray-100"
            : "bg-red-600 text-white hover:bg-red-700"
        }`}
        title={isMicOn ? "Mute microphone" : "Unmute microphone"}
      >
        {isMicOn ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-.622-.622A7 7 0 0017 8a1 1 0 00-2 0 5.003 5.003 0 01-.9 2.857l-1.23-1.23A2.99 2.99 0 0013 8V4a3 3 0 00-5.905-.75L5.586 1.707a1 1 0 00-1.414 1.414l.621.621-.621-.621zM8 4.414L7 3.414V4a3 3 0 003 3h.586L8 4.414zM5 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07A6.995 6.995 0 0013.938 14L5 8z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Stop */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStop();
        }}
        className="p-3 rounded-full shadow-lg bg-red-600 text-white hover:bg-red-700 transition-all"
        title="Stop and disconnect"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Next */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="p-3 rounded-full shadow-lg bg-orange-600 text-white hover:bg-orange-700 transition-all"
        title="Skip to next stranger"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
        </svg>
      </button>
    </div>
  );
}