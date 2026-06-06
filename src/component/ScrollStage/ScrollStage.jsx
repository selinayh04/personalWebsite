import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, createTimeline } from 'animejs';
import ProjectCard from '../ProjectCard/ProjectCard.jsx';
import ProjectLightroom from '../ProjectLightroom/ProjectLightroom.jsx';

const resolveSrc = (path) =>
  path ? `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}` : '';

const SHIFT_DISTANCE = 120;
const TRANSITION_DURATION = 350;
const REFLOW_DURATION = 800;
const REFLOW_EASE = 'outElastic(1, 0.65)';

const STAGGER = 300;
const SLIDE_DURATION = 1500;
const FADE_DURATION = 200;

const SCALE_START = 0.2;
const SCALE_END = 1.0;

const WHEEL_MULTIPLIER = 0.6;
const SMOOTH_DURATION = 700;
const SMOOTH_EASE = 'outCubic';

const ENTRANCE_DELAY = 1500;
const ENTRANCE_DURATION = 1800;
const ENTRANCE_FADE_DURATION = 1200;
// Land so card 1 (phase 0) settles at its featured position (full scale, just before fade).
const ENTRANCE_DISTANCE = SLIDE_DURATION;
const ENTRANCE_EASE = 'outExpo';

const LIFECYCLE = SLIDE_DURATION + FADE_DURATION;

const matchesCategory = (project, category) =>
  category === 'ALL' || (project.category ?? []).includes(category);

const compactPhases = (matches) => {
  const phases = new Array(matches.length).fill(0);
  let order = 0;
  matches.forEach((m, i) => {
    if (m) {
      phases[i] = order * STAGGER;
      order += 1;
    }
  });
  return { phases, period: Math.max(order * STAGGER, LIFECYCLE) };
};

function ScrollStage({ projects = [], activeCategory = 'ALL' }) {
  const [activeProject, setActiveProject] = useState(null);
  const [originRect, setOriginRect] = useState(null);

  const stageRef = useRef(null);
  const containerRefs = useRef([]);
  const shiftRefs = useRef([]);
  const timelinesRef = useRef([]);
  const phasesRef = useRef([]);
  const periodRef = useRef(LIFECYCLE);
  const visibleRef = useRef([]);
  const valueRef = useRef(0);
  const targetRef = useRef(0);
  const seekRef = useRef(() => {});
  const busyRef = useRef(false);
  const activeRef = useRef(false);
  const enteredRef = useRef(false);
  const clickedElRef = useRef(null);
  const prevMatchRef = useRef(null);
  const prevProjectsRef = useRef(null);
  const reflowRef = useRef(null);

  useLayoutEffect(() => {
    if (stageRef.current) stageRef.current.style.opacity = '0';
  }, []);

  useEffect(() => {
    activeRef.current = !!activeProject;
  }, [activeProject]);

  const openProject = (project, el) => {
    if (parseFloat(getComputedStyle(el).opacity) < 0.5) return;
    clickedElRef.current = el;
    el.style.visibility = 'hidden';
    setOriginRect(el.getBoundingClientRect());
    setActiveProject(project);
  };

  const closeProject = () => {
    if (clickedElRef.current) {
      clickedElRef.current.style.visibility = '';
      clickedElRef.current = null;
    }
    setActiveProject(null);
  };

  // Build per-card timelines + scroll handling (rebuilds when the project list changes).
  useEffect(() => {
    const elements = containerRefs.current;

    const timelines = projects.map((_, i) => {
      const el = elements[i];
      if (!el) return null;
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
        { opacity: [1, 0], duration: FADE_DURATION, ease: 'outCubic' },
        SLIDE_DURATION,
      );
      tl.seek(0);
      return tl;
    });
    timelinesRef.current = timelines;

    const seek = (value) => {
      const period = periodRef.current;
      timelines.forEach((tl, i) => {
        if (!tl) return;
        const outer = elements[i];
        if (!visibleRef.current[i]) {
          tl.seek(0);
          if (outer) outer.style.zIndex = '0';
          return;
        }
        let local = (value - phasesRef.current[i]) % period;
        if (local < 0) local += period;
        if (local <= LIFECYCLE) {
          tl.seek(local);
          if (outer) outer.style.zIndex = String(Math.round(local));
        } else {
          tl.seek(0);
          if (outer) outer.style.zIndex = '0';
        }
      });
    };
    seekRef.current = seek;
    seek(valueRef.current);

    targetRef.current = valueRef.current;
    let scrollAnim = null;

    const handleWheel = (e) => {
      e.preventDefault();
      if (activeRef.current || busyRef.current) return;
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;
      else if (e.deltaMode === 2) delta *= window.innerHeight;
      targetRef.current += delta * WHEEL_MULTIPLIER;

      const obj = { value: valueRef.current };
      scrollAnim?.pause();
      scrollAnim = animate(obj, {
        value: targetRef.current,
        duration: SMOOTH_DURATION,
        ease: SMOOTH_EASE,
        onUpdate: () => {
          valueRef.current = obj.value;
          seek(valueRef.current);
        },
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    let entranceTimer = null;
    let entranceAnim = null;
    if (!enteredRef.current && projects.length > 0) {
      enteredRef.current = true;
      targetRef.current = ENTRANCE_DISTANCE;
      const stage = stageRef.current;
      const obj = { value: 0 };
      entranceTimer = setTimeout(() => {
        entranceTimer = null;
        if (stage) {
          animate(stage, {
            opacity: [0, 1],
            duration: ENTRANCE_FADE_DURATION,
            ease: 'outCubic',
          });
        }
        entranceAnim = animate(obj, {
          value: ENTRANCE_DISTANCE,
          duration: ENTRANCE_DURATION,
          ease: ENTRANCE_EASE,
          onUpdate: () => {
            valueRef.current = obj.value;
            seek(valueRef.current);
          },
        });
      }, ENTRANCE_DELAY);
    }

    return () => {
      window.removeEventListener('wheel', handleWheel);
      scrollAnim?.pause();
      if (entranceTimer) {
        clearTimeout(entranceTimer);
        enteredRef.current = false;
      }
      entranceAnim?.pause();
      timelines.forEach((tl) => {
        tl?.cancel?.();
        tl?.revert?.();
      });
    };
  }, [projects]);

  // Filtering: fade out leaving -> reflow (compact / expand) -> fade in entering.
  useEffect(() => {
    const matches = projects.map((p) => matchesCategory(p, activeCategory));
    const prev = prevMatchRef.current;
    const listChanged = prevProjectsRef.current !== projects;
    const { phases: targetPhases, period: targetPeriod } = compactPhases(matches);

    const applyInstant = () => {
      phasesRef.current = targetPhases;
      periodRef.current = targetPeriod;
      visibleRef.current = matches.slice();
      projects.forEach((_, i) => {
        const shift = shiftRefs.current[i];
        const outer = containerRefs.current[i];
        if (shift) {
          shift.style.opacity = matches[i] ? '1' : '0';
          shift.style.transform = 'translateX(0px)';
        }
        if (outer) outer.style.pointerEvents = matches[i] ? 'auto' : 'none';
      });
      seekRef.current(valueRef.current);
    };

    if (prev === null || listChanged) {
      applyInstant();
      prevMatchRef.current = matches;
      prevProjectsRef.current = projects;
      return undefined;
    }

    const leaving = [];
    const entering = [];
    const staying = [];
    matches.forEach((m, i) => {
      if (prev[i] && !m) leaving.push(i);
      else if (!prev[i] && m) entering.push(i);
      else if (m) staying.push(i);
    });

    if (leaving.length === 0 && entering.length === 0) {
      prevMatchRef.current = matches;
      prevProjectsRef.current = projects;
      return undefined;
    }

    busyRef.current = true;
    let cancelled = false;
    const timers = [];
    // Rebased so the anchor (current centre card) keeps its phase; others move relative to it.
    let rebasedTarget = targetPhases.slice();

    leaving.forEach((i) => {
      const shift = shiftRefs.current[i];
      const outer = containerRefs.current[i];
      if (outer) outer.style.pointerEvents = 'none';
      if (shift) {
        animate(shift, {
          translateX: `-${SHIFT_DISTANCE}px`,
          opacity: 0,
          duration: TRANSITION_DURATION,
          ease: 'outCubic',
        });
      }
    });

    const startEnter = () => {
      if (cancelled) return;
      phasesRef.current = rebasedTarget.slice();
      periodRef.current = targetPeriod;
      entering.forEach((i) => {
        visibleRef.current[i] = true;
        const shift = shiftRefs.current[i];
        const outer = containerRefs.current[i];
        if (outer) outer.style.pointerEvents = 'auto';
        if (shift) {
          shift.style.transform = `translateX(${SHIFT_DISTANCE}px)`;
          shift.style.opacity = '0';
          animate(shift, {
            translateX: [`${SHIFT_DISTANCE}px`, '0px'],
            opacity: [0, 1],
            duration: TRANSITION_DURATION,
            ease: 'outCubic',
          });
        }
      });
      seekRef.current(valueRef.current);
      const t = setTimeout(
        () => {
          busyRef.current = false;
        },
        entering.length ? TRANSITION_DURATION : 0,
      );
      timers.push(t);
    };

    const startReflow = () => {
      if (cancelled) return;
      leaving.forEach((i) => {
        visibleRef.current[i] = false;
      });

      // Anchor = currently most-centred (largest on-screen local) staying card.
      if (staying.length > 0) {
        const period = periodRef.current;
        let anchor = staying[0];
        let bestScore = -Infinity;
        staying.forEach((i) => {
          let local = (valueRef.current - phasesRef.current[i]) % period;
          if (local < 0) local += period;
          const score = local <= LIFECYCLE ? local : local - period;
          if (score > bestScore) {
            bestScore = score;
            anchor = i;
          }
        });
        const offset = phasesRef.current[anchor] - targetPhases[anchor];
        rebasedTarget = targetPhases.map((p) => p + offset);
      }

      if (staying.length === 0) {
        startEnter();
        return;
      }

      const fromPhases = phasesRef.current.slice();
      const fromPeriod = periodRef.current;
      const proxy = { t: 0 };
      reflowRef.current = animate(proxy, {
        t: 1,
        duration: REFLOW_DURATION,
        ease: REFLOW_EASE,
        onUpdate: () => {
          const k = proxy.t;
          staying.forEach((i) => {
            phasesRef.current[i] =
              fromPhases[i] + (rebasedTarget[i] - fromPhases[i]) * k;
          });
          periodRef.current = fromPeriod + (targetPeriod - fromPeriod) * k;
          seekRef.current(valueRef.current);
        },
        onComplete: startEnter,
      });
    };

    const tReflow = setTimeout(
      startReflow,
      leaving.length ? TRANSITION_DURATION : 0,
    );
    timers.push(tReflow);

    prevMatchRef.current = matches;
    prevProjectsRef.current = projects;

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      reflowRef.current?.pause();
      busyRef.current = false;
    };
  }, [projects, activeCategory]);

  return (
    <div className="scroll-stage" ref={stageRef}>
      {projects.map((project, i) => (
        <ProjectCard
          key={project.id ?? i}
          number={i + 1}
          image={resolveSrc(project.filePath?.main)}
          onClick={(e) => openProject(project, e.currentTarget)}
          ref={(el) => {
            containerRefs.current[i] = el;
          }}
          shiftRef={(el) => {
            shiftRefs.current[i] = el;
          }}
        />
      ))}

      <ProjectLightroom
        project={activeProject}
        image={resolveSrc(activeProject?.filePath?.main)}
        originRect={originRect}
        isOpen={!!activeProject}
        onClose={closeProject}
      />
    </div>
  );
}

export default ScrollStage;
