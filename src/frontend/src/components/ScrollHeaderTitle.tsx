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
    const scrollContainer = document.querySelector(".app-scroll-container");
    if (!scrollContainer) return;

    let frame = 0;
    const element = scrollContainer as HTMLElement;
    const onScroll = () => setScrollTop(element.scrollTop);

    const measureInitialPosition = () => {
      const title = titleRef.current;
      if (!title) {
        frame = requestAnimationFrame(measureInitialPosition);
        return;
      }

      const rect = title.getBoundingClientRect();
      setTitleTop(rect.top + element.scrollTop);
      setScrollTop(element.scrollTop);
    };

    frame = requestAnimationFrame(measureInitialPosition);
    element.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("scroll", onScroll);
    };
  }, []);

  const compact = titleTop !== null && scrollTop >= titleTop;

  return (
    <>
      <h1
        ref={titleRef}
        className={`z-40 font-black tracking-tight text-white transition-[top,left,width,height,font-size,padding,background-color,box-shadow] duration-150 ease-out ${className}`}
        style={{
          position: compact ? "fixed" : "relative",
          top: compact ? 0 : "auto",
          left: compact ? 0 : 20,
          width: compact ? "100%" : "auto",
          height: compact ? 56 : "auto",
          paddingLeft: compact ? 20 : 0,
          paddingRight: compact ? 20 : 0,
          display: "flex",
          alignItems: "center",
          background: compact ? "#172536" : "transparent",
          boxShadow: compact ? "0 6px 18px rgba(8,17,31,0.18)" : "none",
          fontSize: `${Math.max(18, 30 - Math.min(scrollTop, 120) * 0.1)}px`,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h1>
      {compact && <div className="h-9" aria-hidden="true" />}
    </>
  );
}
