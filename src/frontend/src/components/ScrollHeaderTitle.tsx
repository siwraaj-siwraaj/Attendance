import { useEffect, useRef, useState } from "react";

interface ScrollHeaderTitleProps {
  title: string;
  className?: string;
}

export default function ScrollHeaderTitle({ title, className = "" }: ScrollHeaderTitleProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [titleTop, setTitleTop] = useState<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const titleElement = titleRef.current;
    const scrollContainer = document.querySelector<HTMLElement>(".app-scroll-container");
    if (!titleElement || !scrollContainer) return;

    const measure = () => {
      const rect = titleElement.getBoundingClientRect();
      setTitleTop(rect.top + scrollContainer.scrollTop);
      setScrollTop(scrollContainer.scrollTop);
    };

    const onScroll = () => {
      setScrollTop(scrollContainer.scrollTop);
    };

    // Measure after the page has painted, so Contracts/Advances get the
    // same starting position as Payments without changing their layout.
    const frame = requestAnimationFrame(measure);
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      scrollContainer.removeEventListener("scroll", onScroll);
    };
  }, []);

  const compact = scrollTop > 24;

  return (
    <>
      <h1
        ref={titleRef}
        className={`scroll-header-title ${compact ? "is-compact" : ""} z-50 font-black tracking-tight text-white transition-[top,left,width,height,font-size,padding,background-color,box-shadow] duration-150 ease-out ${className}`}
        style={{
          position: titleTop === null ? "relative" : "fixed",
          top: compact ? "24px" : `${Math.max(0, (titleTop ?? 0) - scrollTop)}px`,
          left: compact ? 0 : 20,
          width: compact ? "100%" : "auto",
          height: compact ? 56 : "auto",
          paddingLeft: compact ? 20 : 0,
          paddingRight: compact ? 20 : 0,
          display: "flex",
          alignItems: "center",
          background: compact ? "#172536" : "transparent",
          borderBottomLeftRadius: compact ? "24px" : 0,
          borderBottomRightRadius: compact ? "24px" : 0,
          boxShadow: compact ? "0 6px 18px rgba(8,17,31,0.18)" : "none",
          fontSize: `${Math.max(18, 30 - Math.min(scrollTop, 120) * 0.1)}px`,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h1>
      {titleTop !== null && <div className="h-9" aria-hidden="true" />}
    </>
  );
}
