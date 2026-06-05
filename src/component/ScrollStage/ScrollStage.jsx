import { useEffect, useRef, useState } from 'react';
import { animate, createTimeline } from 'animejs';
import ProjectCard from '../ProjectCard/ProjectCard.jsx';
import ProjectLightroom from '../ProjectLightroom/ProjectLightroom.jsx';

const resolveSrc = (path) =>
  path ? `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}` : '';

const STAGGER = 300;
const SLIDE_DURATION = 1500;
const FADE_DURATION = 200;

const SCALE_START = 0.2;
const SCALE_END = 1.0;

const WHEEL_MULTIPLIER = 0.6;
const SMOOTH_DURATION = 700;
const SMOOTH_EASE = 'outExpo';

const LIFECYCLE = SLIDE_DURATION + FADE_DURATION;

function ScrollStage() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const containerRefs = useRef([]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}assets/works/project.json`)
      .then((res) => res.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    const elements = containerRefs.current.filter(Boolean);
    if (elements.length === 0) return undefined;

    const period = elements.length * STAGGER;

    const timelines = elements.map((el) => {
      const tl = createTimeline({ autoplay: false });
      tl.add(
        el,
        {
          translateY: ['-150%', '-30%'],
          scale: { from: SCALE_START, to: SCALE_END, ease: 'inCubic' },
          opacity: [1, 1],
          duration: SLIDE_DURATION,
          ease: 'linear',
        },
        0,
      );
      tl.add(
        el,
        {
          opacity: [1, 0],
          duration: FADE_DURATION,
          ease: 'outCubic',
        },
        SLIDE_DURATION,
      );
      tl.seek(0);
      return tl;
    });

    const seekAll = (value) => {
      timelines.forEach((tl, i) => {
        let local = (value - i * STAGGER) % period;
        if (local < 0) local += period;
        if (local <= LIFECYCLE) {
          tl.seek(local);
          elements[i].style.zIndex = String(Math.round(local));
        } else {
          tl.seek(0);
          elements[i].style.zIndex = '0';
        }
      });
    };

    seekAll(0);

    const state = { value: 0 };
    let target = 0;
    let scrollAnim = null;

    const handleWheel = (e) => {
      e.preventDefault();
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;
      else if (e.deltaMode === 2) delta *= window.innerHeight;
      target += delta * WHEEL_MULTIPLIER;

      scrollAnim?.pause();
      scrollAnim = animate(state, {
        value: target,
        duration: SMOOTH_DURATION,
        ease: SMOOTH_EASE,
        onUpdate: () => {
          seekAll(state.value);
        },
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      scrollAnim?.pause();
      timelines.forEach((tl) => {
        tl.cancel?.();
        tl.revert?.();
      });
    };
  }, [projects]);

  return (
    <div className="scroll-stage">
      {projects.map((project, i) => (
        <ProjectCard
          key={project.id ?? i}
          number={i + 1}
          image={resolveSrc(project.filePath?.main)}
          onClick={() => setActiveProject(project)}
          ref={(el) => {
            containerRefs.current[i] = el;
          }}
        />
      ))}

      <ProjectLightroom
        project={activeProject}
        image={resolveSrc(activeProject?.filePath?.main)}
        isOpen={!!activeProject}
        onClose={() => setActiveProject(null)}
      />
    </div>
  );
}

export default ScrollStage;
