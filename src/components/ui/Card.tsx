import { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn("bg-white rounded-lg p-6 shadow-lg", className)}>
      {children}
    </div>
  );
}
