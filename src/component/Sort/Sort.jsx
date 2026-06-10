import { useEffect, useLayoutEffect, useRef } from 'react';
import { animate, splitText, stagger } from 'animejs';
import './Sort.css';

function Sort({ categories, active, onSelect, onCharsReady }) {
  const options = ['ALL', ...categories];
  const categoryKey = categories.join('|');
  const rootRef = useRef(null);
  const ranRef = useRef(false);

  useLayoutEffect(() => {
    if (rootRef.current) rootRef.current.style.opacity = '0';
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || ranRef.current || categoryKey === '') return undefined;
    ranRef.current = true;

    const items = [...root.querySelectorAll('.sort__item')];
    const splits = items.map((el) => splitText(el, { chars: { wrap: 'clip' } }));

    let anim = null;
    const timer = setTimeout(() => {
      root.style.opacity = '1';
      anim = animate(
        splits.flatMap((s) => s.chars),
        {
          y: [{ to: ['100%', '0%'] }],
          duration: 550,
          ease: 'outCubic',
          delay: stagger(60),
          onComplete: () => {
            onCharsReady?.(splits.flatMap((s) => s.chars));
          },
        },
      );
    }, 2500);

    return () => {
      clearTimeout(timer);
      anim?.pause();
      splits.forEach((s) => s.revert());
    };
  }, [categoryKey]);

  return (
    <div className="sort" ref={rootRef}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`sort__item${option === active ? ' is-active' : ''}`}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default Sort;
