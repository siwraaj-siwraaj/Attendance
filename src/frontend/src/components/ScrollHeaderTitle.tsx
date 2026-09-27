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
    const onScroll = () => setScrollTop((scrollContainer as HTMLElement).scrollTop);

    const measureInitialPosition = () => {
      const title = titleRef.current;
      if (!title) {
        frame = requestAnimationFrame(measureInitialPosition);
        return;
      }

      const rect = title.getBoundingClientRect();
      setTitleTop(rect.top + (scrollContainer as HTMLElement).scrollTop);
      setScrollTop((scrollContainer as HTMLElement).scrollTop);
    };

    frame = requestAnimationFrame(measureInitialPosition);
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      scrollContainer.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <h1
        ref={titleRef}
        className={`z-40 font-black tracking-tight text-white transition-[top,left,width,height,font-size,padding,background-color,box-shadow] duration-150 ease-out ${className}`}
        style={{
          position: titleTop === null ? "relative" : "fixed",
          top: `${Math.max(0, (titleTop ?? 0) - scrollTop)}px`,
          left: scrollTop > 24 ? 0 : 20,
          width: scrollTop > 24 ? "100%" : "auto",
          height: scrollTop > 24 ? 56 : "auto",
          paddingLeft: scrollTop > 24 ? 20 : 0,
          paddingRight: scrollTop > 24 ? 20 : 0,
          display: "flex",
          alignItems: "center",
          background: scrollTop > 24 ? "#172536" : "transparent",
          boxShadow: scrollTop > 24 ? "0 6px 18px rgba(8,17,31,0.18)" : "none",
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
