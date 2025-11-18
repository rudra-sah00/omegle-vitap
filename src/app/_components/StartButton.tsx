"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import SignInModal from "@/app/_components/SignInModal";

export default function StartButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStart = () => {
    setIsModalOpen(true);
  };

  const handleSignInSuccess = () => {
    // TODO: Navigate to chat page or start matching
    console.log("Sign in successful, ready to start chatting");
  };

  return (
    <>
      <div className="flex justify-center">
        <Button onClick={handleStart}>
          Start
        </Button>
      </div>

      <SignInModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSignInSuccess={handleSignInSuccess}
      />
    </>
  );
}
