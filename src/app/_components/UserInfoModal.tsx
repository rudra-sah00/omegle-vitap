"use client";

import { useState } from "react";

interface UserInfoModalProps {
  isOpen: boolean;
  onSubmit: (name: string, gender: string) => void;
  onClose: () => void;
}

export default function UserInfoModal({ isOpen, onSubmit, onClose }: UserInfoModalProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && gender) {
      onSubmit(name.trim(), gender);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
        <p className="text-gray-600 mb-6">Please tell us a bit about yourself</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              required
              maxLength={30}
            />
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  gender === "male"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  gender === "female"
                    ? "bg-pink-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => setGender("other")}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  gender === "other"
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Other
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!name.trim() || !gender}
            className={`w-full py-3 rounded-lg font-semibold text-lg transition-all ${
              name.trim() && gender
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Start Chatting
          </button>
        </form>
      </div>
    </div>
  );
}
