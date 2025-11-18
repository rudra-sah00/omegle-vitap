"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export default function Button({ 
  children, 
  variant = "primary", 
  size = "md",
  className,
  ...props 
}: ButtonProps) {
  const baseStyles = "font-bold rounded-lg shadow-lg transition-colors";
  
  const variants = {
    primary: "bg-blue-700 hover:bg-blue-800 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    outline: "border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
  };

  const sizes = {
    sm: "px-6 py-2 text-sm",
    md: "px-12 py-4 text-xl",
    lg: "px-16 py-5 text-2xl"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
