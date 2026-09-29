import React from "react";

interface ScrollHeaderTitleProps {
  title: string;
  className?: string;
}

export default function ScrollHeaderTitle({ title, className = "" }: ScrollHeaderTitleProps) {
  return (
    <h1 className={`scroll-header-title z-50 font-black tracking-tight text-white ${className}`}>
      {title}
    </h1>
  );
}
