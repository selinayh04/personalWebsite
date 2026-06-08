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

const loadRatio = (src) =>
  new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im.naturalWidth / im.naturalHeight || 16 / 9);
    im.onerror = () => resolve(16 / 9);
    im.src = src;
  });

function ProjectLightroom({ project, image, originRect, isOpen, onClose }) {
  const [render, setRender] = useState(false);
  const [loop, setLoop] = useState(null);

  const dataRef = useRef({});
  const imgRef = useRef(null);
  const backdropRef = useRef(null);
  const stripRef = useRef(null);
  const infoRef = useRef(null);

  const targetBoxRef = useRef(null);
  const morphDoneRef = useRef(false);
  const ratiosRef = useRef(null);
  const loopParamsRef = useRef(null);
  const valueXRef = useRef(0);
  const targetXRef = useRef(0);
  const readyRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (isOpen && project) {
      dataRef.current = { project, image, originRect };
      setRender(true);
    }
  }, [isOpen, project, image, originRect]);

  const buildLoop = () => {
    if (cancelledRef.current) return;
    if (!morphDoneRef.current || !ratiosRef.current || !targetBoxRef.current) return;

    const target = targetBoxRef.current;
    const H = target.height;
    const images = ratiosRef.current.map((r) => ({
      src: r.src,
      width: H * r.ratio,
    }));
    const setWidth = images.reduce((sum, im) => sum + im.width, 0);
    const period = setWidth + images.length * GAP;
    const copies = Math.ceil(window.innerWidth / period) + 3;
    const middle = Math.floor(copies / 2);
    const translateX0 = target.left - middle * period;

    loopParamsRef.current = { period, translateX0 };
    valueXRef.current = 0;
    targetXRef.current = 0;
    setLoop({ images, H, top: target.top, copies });
  };

  // Once the carousel is in the DOM: place it, fade it in, then hand off from
  // the morphing hero image so the swap is seamless.
  useLayoutEffect(() => {
    if (!loop) return;
    const strip = stripRef.current;
    const params = loopParamsRef.current;
    if (!strip || !params) return;

    strip.style.transform = `translateX(${params.translateX0}px)`;
    strip.style.opacity = '0';
    animate(strip, {
      opacity: [0, 1],
      duration: 300,
      ease: 'outCubic',
      onComplete: () => {
        if (imgRef.current) imgRef.current.style.display = 'none';
        readyRef.current = true;
      },
    });
  }, [loop]);

  useLayoutEffect(() => {
    if (!render) return;
    const img = imgRef.current;
    const backdrop = backdropRef.current;
    const info = infoRef.current;
    const { originRect: origin, image: src } = dataRef.current;

    cancelledRef.current = false;
    morphDoneRef.current = false;
    ratiosRef.current = null;
    readyRef.current = false;
    valueXRef.current = 0;
    targetXRef.current = 0;
    if (info) info.style.opacity = '0';

    if (backdrop) {
      animate(backdrop, {
        opacity: [0, 1],
        duration: MORPH_DURATION,
        ease: 'outCubic',
      });
    }

    if (!img || !src || !origin) return;

    const additional = dataRef.current.project.filePath?.additional ?? [];
    const srcs = [src, ...additional.map(resolveSrc)];

    setBox(img, origin);
    const pre = new Image();
    pre.onload = () => {
      if (cancelledRef.current) return;
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
      targetBoxRef.current = target;

      if (info) info.style.top = `${top + base.height + INFO_GAP}px`;
      animate(img, {
        left: [`${origin.left}px`, `${target.left}px`],
        top: [`${origin.top}px`, `${target.top}px`],
        width: [`${origin.width}px`, `${target.width}px`],
        height: [`${origin.height}px`, `${target.height}px`],
        duration: MORPH_DURATION,
        ease: 'outCubic',
        onComplete: () => {
          if (info) {
            animate(info, { opacity: [0, 1], duration: 300, ease: 'outCubic' });
          }
          morphDoneRef.current = true;
          buildLoop();
        },
      });
    };
    pre.src = src;

    // Preload every image to get its aspect ratio for the carousel layout.
    Promise.all(srcs.map(loadRatio)).then((ratios) => {
      if (cancelledRef.current) return;
      ratiosRef.current = ratios.map((r, i) => ({ src: srcs[i], ratio: r }));
      buildLoop();
    });
  }, [render]);

  useEffect(() => {
    if (!render) return undefined;
    let scrollAnim = null;

    const apply = () => {
      const params = loopParamsRef.current;
      const strip = stripRef.current;
      if (!params || !strip) return;
      let x = valueXRef.current % params.period;
      if (x < 0) x += params.period;
      strip.style.transform = `translateX(${params.translateX0 - x}px)`;
    };

    const handleWheel = (e) => {
      if (!readyRef.current) return;
      e.preventDefault();
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;
      else if (e.deltaMode === 2) delta *= window.innerWidth;
      targetXRef.current += delta * WHEEL_MULTIPLIER;

      scrollAnim?.pause();
      const obj = { x: valueXRef.current };
      scrollAnim = animate(obj, {
        x: targetXRef.current,
        duration: SCROLL_DURATION,
        ease: SCROLL_EASE,
        onUpdate: () => {
          valueXRef.current = obj.x;
          apply();
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
    const strip = stripRef.current;
    const info = infoRef.current;
    const { originRect: origin } = dataRef.current;

    cancelledRef.current = true;
    readyRef.current = false;

    if (strip) animate(strip, { opacity: 0, duration: MORPH_DURATION, ease: 'outCubic' });
    if (info) animate(info, { opacity: 0, duration: MORPH_DURATION, ease: 'outCubic' });
    if (backdrop) {
      animate(backdrop, {
        opacity: [1, 0],
        duration: MORPH_DURATION,
        ease: 'outCubic',
      });
    }

    const finish = () => {
      setRender(false);
      setLoop(null);
      onClose();
    };

    if (img && origin && targetBoxRef.current) {
      img.style.display = '';
      setBox(img, targetBoxRef.current);
      animate(img, {
        left: `${origin.left}px`,
        top: `${origin.top}px`,
        width: `${origin.width}px`,
        height: `${origin.height}px`,
        duration: MORPH_DURATION,
        ease: 'outCubic',
        onComplete: finish,
      });
    } else {
      finish();
    }
  };

  if (!render) return null;

  const { project: p, image: src } = dataRef.current;

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

      {loop && (
        <div
          className="project-lightroom__loop"
          ref={stripRef}
          style={{ top: `${loop.top}px`, height: `${loop.H}px` }}
        >
          {Array.from({ length: loop.copies }).flatMap((_, c) =>
            loop.images.map((im, k) => (
              <img
                key={`${c}-${k}`}
                className="project-lightroom__photo"
                src={im.src}
                alt={p.name}
                onClick={(e) => e.stopPropagation()}
              />
            )),
          )}
        </div>
      )}

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
