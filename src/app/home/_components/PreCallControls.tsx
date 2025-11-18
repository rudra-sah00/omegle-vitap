"use client";

interface PreCallControlsProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  onMicToggle: () => void;
  onCameraToggle: () => void;
  onStart: () => void;
}

export default function PreCallControls({
  isMicOn,
  isCameraOn,
  onMicToggle,
  onCameraToggle,
  onStart,
}: PreCallControlsProps) {
  return (
    <>
      {/* Camera and Mic controls above Start button */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-3 z-10">
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
      </div>

      {/* Start button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-12 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg text-lg z-10"
      >
        Start
      </button>
    </>
  );
}
