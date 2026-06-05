import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import './ProjectLightroom.css';

const crossIcon = `${import.meta.env.BASE_URL}assets/icons/cross.svg`;
const MORPH_DURATION = 500;

const centeredBox = (ratio) => {
  const maxW = window.innerWidth * 0.9;
  const maxH = window.innerHeight * 0.9;
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
    const { originRect: origin, image: src } = dataRef.current;

    if (backdrop) {
      animate(backdrop, {
        opacity: [0, 1],
        duration: MORPH_DURATION,
        ease: 'outCubic',
      });
    }

    if (!img || !src || !origin) return;

    setBox(img, origin);
    const pre = new Image();
    pre.onload = () => {
      const ratio = pre.naturalWidth / pre.naturalHeight || 16 / 9;
      const target = centeredBox(ratio);
      animate(img, {
        left: [`${origin.left}px`, `${target.left}px`],
        top: [`${origin.top}px`, `${target.top}px`],
        width: [`${origin.width}px`, `${target.width}px`],
        height: [`${origin.height}px`, `${target.height}px`],
        duration: MORPH_DURATION,
        ease: 'outCubic',
      });
    };
    pre.src = src;
  }, [render]);

  const handleClose = () => {
    const img = imgRef.current;
    const backdrop = backdropRef.current;
    const { originRect: origin } = dataRef.current;

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
    </div>
  );
}

export default ProjectLightroom;
