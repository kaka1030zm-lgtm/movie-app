"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // アニメーション完了後に閉じる
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-[#d4af37]" />,
    error: <AlertCircle className="h-5 w-5 text-red-400" />,
    info: <AlertCircle className="h-5 w-5 text-white/60" />,
  };

  const bgColors = {
    success: "bg-white/10 border-[#d4af37]/30 backdrop-blur-xl",
    error: "bg-red-500/20 border-red-500/30 backdrop-blur-xl",
    info: "bg-white/10 border-white/20 backdrop-blur-xl",
  };

  return (
    <div
      className={`fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95"
      } ${bgColors[type]}`}
    >
      {icons[type]}
      <p className="text-sm font-semibold text-white">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 text-white/40 hover:text-white transition-all duration-200 p-1 rounded-lg hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
