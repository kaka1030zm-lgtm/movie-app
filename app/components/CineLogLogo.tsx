"use client";

interface CineLogLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function CineLogLogo({ size = "md", className = "" }: CineLogLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8 sm:w-10 sm:h-10",
    md: "w-10 h-10 sm:w-12 sm:h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* シンプルで唯一無二感のあるモノグラム: CとLをエレガントに組み合わせたデザイン */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#B8941F" />
          </linearGradient>
        </defs>
        {/* Cの部分（より洗練された曲線） */}
        <path
          d="M10 24C10 16 14 10 22 10C28 10 32 12 34 16"
          stroke="url(#goldGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M10 24C10 32 14 38 22 38C28 38 32 36 34 32"
          stroke="url(#goldGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Lの部分（Cと自然に接続） */}
        <path
          d="M34 16L34 32"
          stroke="url(#goldGradient)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M34 32L40 32"
          stroke="url(#goldGradient)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}


