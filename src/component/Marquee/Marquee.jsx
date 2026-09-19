import { useLayoutEffect, useRef, useState } from 'react';
import './Marquee.css';

/**
 * A single row of very large text that scrolls horizontally forever.
 * The phrase is repeated enough times to fill any viewport width, then the
 * whole group is duplicated so the translate loop is seamless.
 *
 * Props:
 *  - text: the headline to scroll
 *  - onClick: open handler (whole row is clickable)
 *  - direction: 'left' | 'right'
 *  - speed: pixels per second
 */
function Marquee({
  text,
  onClick,
  onMouseEnter,
  onMouseLeave,
  direction = 'left',
  speed = 70,
  className = '',
}) {
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const [repeats, setRepeats] = useState(4);
  const [duration, setDuration] = useState(24);

  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const phrase = measureRef.current;
      if (!container || !phrase) return;
      const phraseW = phrase.getBoundingClientRect().width;
      const containerW = container.getBoundingClientRect().width;
      if (phraseW <= 0) return;
      const needed = Math.max(2, Math.min(4, Math.ceil(containerW / phraseW) + 1));
      const nextDuration = (phraseW * needed) / speed;
      setRepeats((prev) => (prev === needed ? prev : needed));
      setDuration((prev) => (Math.abs(prev - nextDuration) < 0.05 ? prev : nextDuration));
    };
    measure();

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text, speed]);

  const group = Array.from({ length: repeats }).map((_, i) => (
    <span className="marquee__word" key={i} aria-hidden={i > 0 ? 'true' : undefined}>
      {text}
    </span>
  ));

  return (
    <div
      className={`marquee marquee--${direction} ${className}`.trim()}
      ref={containerRef}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e);
        }
      }}
    >
      {/* Hidden single phrase used only for width measurement */}
      <span className="marquee__measure" ref={measureRef} aria-hidden="true">
        {text}
      </span>

      <div className="marquee__clip">
        <div className="marquee__track" style={{ '--marquee-duration': `${duration}s` }}>
          <div className="marquee__group">{group}</div>
          <div className="marquee__group" aria-hidden="true">
            {group}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Marquee;
