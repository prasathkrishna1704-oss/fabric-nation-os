import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={cn("w-6 h-6", className)} 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path 
        d="M 60 25 L 50 15 L 15 50 L 30 65 M 32.5 32.5 L 45 45" 
        stroke="#C80018" 
        strokeWidth="16" 
        fill="none" 
        strokeLinejoin="round" 
        strokeLinecap="butt" 
      />
      <path 
        d="M 40 75 L 50 85 L 85 50 L 70 35 M 67.5 67.5 L 55 55" 
        stroke="#1D1E27" 
        strokeWidth="16" 
        fill="none" 
        strokeLinejoin="round" 
        strokeLinecap="butt" 
      />
    </svg>
  );
}
