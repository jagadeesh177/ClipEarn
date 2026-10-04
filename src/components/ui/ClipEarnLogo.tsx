import React from "react";
import Link from "next/link";

interface ClipEarnLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  className?: string;
}

/**
 * Wordmark set in the expanded cut of Archivo. No italics, glow or hover
 * scaling: the mark carries the brand through weight, width and the one
 * signal colour.
 */
export const ClipEarnLogo: React.FC<ClipEarnLogoProps> = ({
  size = "md",
  href,
  className = "",
}) => {
  const sizeClasses = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  const content = (
    <span
      className={`font-display inline-flex items-baseline select-none font-extrabold uppercase leading-none ${sizeClasses[size]} ${className}`}
      aria-label="ClipEarn"
    >
      <span className="text-white">Clip</span>
      <span className="text-[var(--signal)]">Earn</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex rounded-sm">
        {content}
      </Link>
    );
  }

  return content;
};
