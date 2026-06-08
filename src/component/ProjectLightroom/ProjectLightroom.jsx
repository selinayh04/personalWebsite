import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import './ProjectLightroom.css';

const crossIcon = `${import.meta.env.BASE_URL}assets/icons/cross.svg`;
const MORPH_DURATION = 500;

const GAP = 32;
const WHEEL_MULTIPLIER = 1;
const SCROLL_DURATION = 600;
const SCROLL_EASE = 'outExpo';

// Fraction of the viewport the main image is allowed to fill. Lower = smaller image.
const VIEW_FRACTION = 0.75;
const INFO_GAP = 16;
const MIN_TOP = 24;

const resolveSrc = (path) =>
  path ? `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}` : '';

const centeredBox = (ratio) => {
  const maxW = window.innerWidth * VIEW_FRACTION;
  const maxH = window.innerHeight * VIEW_FRACTION;
  let width = maxW;
  let height = width / ratio;
  if (height > maxH) {
    height = maxH;
    width = height * ratio;
  }
  return {
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
    width,
    height,
  };
};

const setBox = (el, box) => {
  el.style.left = `${box.left}px`;
  el.style.top = `${box.top}px`;
  el.style.width = `${box.width}px`;
  el.style.height = `${box.height}px`;
};

function ProjectLightroom({ project, image, originRect, isOpen, onClose }) {
  const [render, setRender] = useState(false);
  const dataRef = useRef({});
  const imgRef = useRef(null);
  const backdropRef = useRef(null);
  const trackRef = useRef(null);
  const restRef = useRef(null);
  const infoRef = useRef(null);

  const scrollXRef = useRef(0);
  const targetXRef = useRef(0);
  const readyRef = useRef(false);

  useEffect(() => {
    if (isOpen && project) {
      dataRef.current = { project, image, originRect };
      setRender(true);
    }
  }, [isOpen, project, image, originRect]);

  useLayoutEffect(() => {
    if (!render) return;
    const img = imgRef.current;
    const backdrop = backdropRef.current;
    const track = trackRef.current;
    const rest = restRef.current;
    const info = infoRef.current;
    const { originRect: origin, image: src } = dataRef.current;

    scrollXRef.current = 0;
    targetXRef.current = 0;
    readyRef.current = false;
    if (track) track.style.transform = 'translateX(0px)';
    if (rest) rest.style.opacity = '0';
    if (info) info.style.opacity = '0';

    if (backdrop) {
      animate(backdrop, {
        opacity: [0, 1],
        duration: MORPH_DURATION,
        ease: 'outCubic',
      });
    }

    if (!img || !src || !origin) return;

    const positionRest = (target) => {
      if (!rest) return;
      rest.style.top = `${target.top}px`;
      rest.style.height = `${target.height}px`;
      rest.style.left = `${target.left + target.width + GAP}px`;
    };

    setBox(img, origin);
    const pre = new Image();
    pre.onload = () => {
      const ratio = pre.naturalWidth / pre.naturalHeight || 16 / 9;
      const base = centeredBox(ratio);

      // Measure the info bar at the image width, then centre the whole
      // (image + gap + info) group vertically.
      let infoH = 0;
      if (info) {
        info.style.left = `${base.left}px`;
        info.style.width = `${base.width}px`;
        infoH = info.offsetHeight;
      }
      const totalH = base.height + INFO_GAP + infoH;
      const top = Math.max(MIN_TOP, (window.innerHeight - totalH) / 2);
      const target = { left: base.left, top, width: base.width, height: base.height };

      positionRest(target);
      if (info) info.style.top = `${top + base.height + INFO_GAP}px`;
      animate(img, {
        left: [`${origin.left}px`, `${target.left}px`],
        top: [`${origin.top}px`, `${target.top}px`],
        width: [`${origin.width}px`, `${target.width}px`],
        height: [`${origin.height}px`, `${target.height}px`],
        duration: MORPH_DURATION,
        ease: 'outCubic',
        onComplete: () => {
          readyRef.current = true;
          if (rest) {
            animate(rest, { opacity: [0, 1], duration: 300, ease: 'outCubic' });
          }
          if (info) {
            animate(info, { opacity: [0, 1], duration: 300, ease: 'outCubic' });
          }
        },
      });
    };
    pre.src = src;
  }, [render]);

  useEffect(() => {
    if (!render) return undefined;
    let scrollAnim = null;

    const handleWheel = (e) => {
      if (!readyRef.current) return;
      e.preventDefault();
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;
      else if (e.deltaMode === 2) delta *= window.innerWidth;
      targetXRef.current -= delta * WHEEL_MULTIPLIER;

      let minX = 0;
      const rest = restRef.current;
      if (rest) {
        const rightAtZero = rest.getBoundingClientRect().right - scrollXRef.current;
        const edge = window.innerWidth * 0.05;
        minX = Math.min(0, -(rightAtZero - window.innerWidth + edge));
      }
      if (targetXRef.current > 0) targetXRef.current = 0;
      if (targetXRef.current < minX) targetXRef.current = minX;

      scrollAnim?.pause();
      const obj = { x: scrollXRef.current };
      scrollAnim = animate(obj, {
        x: targetXRef.current,
        duration: SCROLL_DURATION,
        ease: SCROLL_EASE,
        onUpdate: () => {
          scrollXRef.current = obj.x;
          if (trackRef.current) {
            trackRef.current.style.transform = `translateX(${obj.x}px)`;
          }
        },
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      scrollAnim?.pause();
    };
  }, [render]);

  const handleClose = () => {
    const img = imgRef.current;
    const backdrop = backdropRef.current;
    const track = trackRef.current;
    const rest = restRef.current;
    const info = infoRef.current;
    const { originRect: origin } = dataRef.current;

    readyRef.current = false;
    scrollXRef.current = 0;
    targetXRef.current = 0;
    if (track) track.style.transform = 'translateX(0px)';
    if (rest) animate(rest, { opacity: 0, duration: MORPH_DURATION, ease: 'outCubic' });
    if (info) animate(info, { opacity: 0, duration: MORPH_DURATION, ease: 'outCubic' });

    if (backdrop) {
      animate(backdrop, {
        opacity: [1, 0],
        duration: MORPH_DURATION,
        ease: 'outCubic',
      });
    }

    if (img && origin) {
      animate(img, {
        left: `${origin.left}px`,
        top: `${origin.top}px`,
        width: `${origin.width}px`,
        height: `${origin.height}px`,
        duration: MORPH_DURATION,
        ease: 'outCubic',
        onComplete: () => {
          setRender(false);
          onClose();
        },
      });
    } else {
      setRender(false);
      onClose();
    }
  };

  if (!render) return null;

  const { project: p, image: src } = dataRef.current;
  const additional = p.filePath?.additional ?? [];

  return (
    <div className="project-lightroom" onClick={handleClose}>
      <div className="project-lightroom__backdrop" ref={backdropRef} />
      <button
        type="button"
        className="project-lightroom__close"
        onClick={handleClose}
      >
        <img src={crossIcon} alt="Close" />
      </button>
      <div className="project-lightroom__track" ref={trackRef}>
        {src ? (
          <img
            ref={imgRef}
            className="project-lightroom__img"
            src={src}
            alt={p.name}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="project-lightroom__title"
            onClick={(e) => e.stopPropagation()}
          >
            {p.name}
          </span>
        )}
        <div className="project-lightroom__rest" ref={restRef}>
          {additional.map((path, idx) => (
            <img
              key={path ?? idx}
              className="project-lightroom__photo"
              src={resolveSrc(path)}
              alt={`${p.name} ${idx + 2}`}
              onClick={(e) => e.stopPropagation()}
            />
          ))}
        </div>
      </div>

      <div
        className="project-lightroom__info"
        ref={infoRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="project-lightroom__info-top">
          <div className="project-lightroom__info-left">
            <div className="project-lightroom__info-name">{p.name}</div>
            <div className="project-lightroom__info-meta">
              {[p.date, p.medium, p.dimension].filter(Boolean).join('  /  ')}
            </div>
          </div>
          <div className="project-lightroom__info-right">
            {(p.category ?? []).join(', ')}
          </div>
        </div>
        {p.description && (
          <p className="project-lightroom__info-desc">{p.description}</p>
        )}
      </div>
    </div>
  );
}

export default ProjectLightroom;
