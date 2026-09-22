import React from "react";
import Link from "next/link";

interface ClipEarnLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  className?: string;
}

export const ClipEarnLogo: React.FC<ClipEarnLogoProps> = ({
  size = "md",
  href,
  className = "",
}) => {
  const sizeClasses = {
    sm: "text-lg tracking-wider",
    md: "text-2xl tracking-wider",
    lg: "text-3xl tracking-widest",
    xl: "text-4xl tracking-widest font-black",
  };

  const content = (
    <div className={`inline-flex items-center select-none font-black italic uppercase transition-transform hover:scale-[1.02] ${className}`}>
      <span className={`${sizeClasses[size]} text-white`}>CLIP</span>
      <span className={`${sizeClasses[size]} text-[#1cf7fd] drop-shadow-[0_0_12px_rgba(28,247,253,0.6)]`}>
        EARN
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};
