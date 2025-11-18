"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context";
import { UserService } from "@/services/userService";
import ProtectedRoute from "@/app/_components/ProtectedRoute";

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showName, setShowName] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserSettings = async () => {
      if (user) {
        try {
          const userData = await UserService.getUser(user.uid);
          if (userData) {
            setShowName(userData.showName || false);
          }
        } catch (error) {
          console.error("Error loading user settings:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadUserSettings();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleToggleShowName = async () => {
    if (!user) return;
    
    try {
      const newValue = !showName;
      await UserService.updateShowName(user.uid, newValue);
      setShowName(newValue);
    } catch (error) {
      console.error("Error updating show name:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action will mark your account as deleted."
    );
    
    if (confirmed) {
      setIsDeleting(true);
      try {
        await UserService.markAsDeleted(user.uid);
        alert("Account marked as deleted. You will be signed out.");
        await signOut();
        router.push("/");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Failed to delete account. Please try again.");
        setIsDeleting(false);
      }
    }
  };

  if (!user || loading) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Account</h1>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-6">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover mr-4"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{user.displayName || "Anonymous"}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">{user.uid}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <p className="text-gray-900">{user.displayName || "Not set"}</p>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-medium">Show Name to Strangers</p>
                <p className="text-sm text-gray-600">Display your name during chats</p>
              </div>
              <button
                onClick={handleToggleShowName}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showName ? "bg-gray-900" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showName ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/home")}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Back to Chat
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
            >
              Sign Out
            </button>

            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
