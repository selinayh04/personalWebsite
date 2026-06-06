import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import './ExpandablePanel.css';

function ExpandablePanel({ isOpen, children, className = '' }) {
  const ref = useRef(null);
  const prevOpenRef = useRef(isOpen);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prevOpenRef.current === isOpen) return;
    prevOpenRef.current = isOpen;

    if (isOpen) {
      el.style.height = 'auto';
      const target = el.scrollHeight;
      el.style.height = '0px';
      animate(el, {
        height: ['0px', `${target}px`],
        opacity: [0, 1],
        duration: 400,
        ease: 'outCubic',
        onComplete: () => {
          el.style.height = 'auto';
        },
      });
    } else {
      const current = el.scrollHeight;
      animate(el, {
        height: [`${current}px`, '0px'],
        opacity: [1, 0],
        duration: 300,
        ease: 'outCubic',
      });
    }
  }, [isOpen]);

  return (
    <div
      ref={ref}
      className={`expandable-panel ${className}`.trim()}
      style={{ height: 0, opacity: 0, overflow: 'hidden' }}
    >
      {children}
    </div>
  );
}

export default ExpandablePanel;
