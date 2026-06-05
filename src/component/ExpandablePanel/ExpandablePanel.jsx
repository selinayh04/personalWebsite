import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import './ExpandablePanel.css';

function ExpandablePanel({ isOpen, children, className = '' }) {
  const ref = useRef(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

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
    <div ref={ref} className={`expandable-panel ${className}`.trim()}>
      {children}
    </div>
  );
}

export default ExpandablePanel;
