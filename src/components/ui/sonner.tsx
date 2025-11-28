"use client";

import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-slate-500",
          actionButton:
            "group-[.toast]:bg-slate-900 group-[.toast]:text-slate-50",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500",
          error:
            "group-[.toaster]:bg-red-500 group-[.toaster]:text-white group-[.toaster]:border-red-600",
          success:
            "group-[.toaster]:bg-green-500 group-[.toaster]:text-white group-[.toaster]:border-green-600",
          warning:
            "group-[.toaster]:bg-amber-500 group-[.toaster]:text-white group-[.toaster]:border-amber-600",
          info:
            "group-[.toaster]:bg-blue-500 group-[.toaster]:text-white group-[.toaster]:border-blue-600",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
