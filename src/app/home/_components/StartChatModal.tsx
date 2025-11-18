"use client";

import { Modal } from "@/components/ui";

interface StartChatModalProps {
  isOpen: boolean;
  onStart: () => void;
}

export default function StartChatModal({ isOpen, onStart }: StartChatModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <div className="p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Ready?
        </h2>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-gray-700 text-sm mb-3">
            By clicking "Start", you confirm that you have read and agree to our Terms of Service.
          </p>
          <ul className="text-gray-600 text-xs space-y-1 list-disc list-inside">
            <li>Be respectful to other users</li>
            <li>Do not share personal information</li>
            <li>You must be 18+ to use this service</li>
          </ul>
        </div>

        <button
          onClick={onStart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors mb-3"
        >
          Start
        </button>

        <p className="text-xs text-gray-500 text-center">
          <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
            Terms of Service
          </a>
        </p>
      </div>
    </Modal>
  );
}
