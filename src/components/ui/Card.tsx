import { ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * Props for Card component
 */
interface CardProps {
  /** Card content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Card container component with default styling
 * @param props - Card component props
 * @returns Styled card container
 */
export default function Card({ children, className }: CardProps) {
  return <div className={cn("bg-white rounded-lg p-6 shadow-lg", className)}>{children}</div>;
}
