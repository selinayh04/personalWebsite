import { useEffect, useMemo, useRef, useState } from 'react';
import { animate } from 'animejs';
import ProjectCard from '../ProjectCard/ProjectCard.jsx';
import ProjectLightroom from '../ProjectLightroom/ProjectLightroom.jsx';
import './ProjectGrid.css';

const resolveSrc = (path) =>
  path ? `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}` : '';

const matchesCategory = (project, category) =>
  category === 'ALL' || (project.category ?? []).includes(category);

// Round-robin interleave so same-category projects don't clump together.
const interleave = (list) => {
  const buckets = new Map();
  list.forEach((p) => {
    const cat = (p.category ?? [''])[0] || '';
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat).push(p);
  });
  const groups = [...buckets.values()];
  const result = [];
  const maxLen = Math.max(...groups.map((g) => g.length));
  for (let i = 0; i < maxLen; i++) {
    groups.forEach((g) => { if (i < g.length) result.push(g[i]); });
  }
  return result;
};

// Each row must span exactly 4 grid columns (2–4 items per row).
// Uses a seeded LCG so the same item count always yields the same layout.
const ROW_PATTERNS = [
  [2, 2],       // 2 items
  [3, 1],       // 2 items (asymmetric)
  [1, 3],       // 2 items (asymmetric)
  [1, 2, 1],   // 3 items
  [2, 1, 1],   // 3 items
  [1, 1, 2],   // 3 items
  [1, 1, 1, 1], // 4 items
];

const generateSpans = (count) => {
  let s = count * 2654435761;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967295;
  };
  const spans = [];
  while (spans.length < count) {
    const pattern = ROW_PATTERNS[Math.floor(rand() * ROW_PATTERNS.length)];
    pattern.forEach((span) => { if (spans.length < count) spans.push(span); });
  }
  return spans;
};

function ProjectGrid({ projects = [], activeCategory = 'ALL' }) {
  const [activeProject, setActiveProject] = useState(null);
  const [originRect, setOriginRect] = useState(null);
  const [ratios, setRatios] = useState({});
  const rootRef = useRef(null);
  const clickedElRef = useRef(null);

  const filtered = projects.filter((p) => matchesCategory(p, activeCategory));
  const visible = activeCategory === 'ALL' ? interleave(filtered) : filtered;
  const spans = useMemo(() => generateSpans(visible.length), [visible.length]);

  // Load each image's natural aspect ratio so columns get varying heights.
  useEffect(() => {
    let cancelled = false;
    projects.forEach((project) => {
      const src = resolveSrc(project.filePath?.main);
      if (!src) return;
      setRatios((prev) => {
        if (prev[src]) return prev;
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          const r = img.naturalWidth / img.naturalHeight;
          setRatios((p) => (p[src] === r ? p : { ...p, [src]: r }));
        };
        img.src = src;
        return prev;
      });
    });
    return () => { cancelled = true; };
  }, [projects]);

  useEffect(() => {
    if (rootRef.current) {
      animate(rootRef.current, { opacity: [0, 1], duration: 400, ease: 'outCubic' });
    }
  }, []);

  const openProject = (project, el) => {
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

  return (
    <div className="project-grid" ref={rootRef}>
      {visible.map((project, i) => {
        const src = resolveSrc(project.filePath?.main);
        const ratio = ratios[src];
        return (
          <div
            key={project.id ?? i}
            className="project-grid__item"
            style={{ gridColumn: `span ${spans[i] ?? 1}` }}
            onClick={(e) => openProject(project, e.currentTarget.querySelector('.project-card') ?? e.currentTarget)}
          >
            <ProjectCard
              number={i + 1}
              image={src}
              className="project-grid__card"
              style={ratio ? { aspectRatio: String(ratio) } : undefined}
            />
            <div className="project-grid__label">
              <span className="project-grid__label-name">{project.name}</span>
              <span className="project-grid__label-meta">
                {(project.category ?? []).join(', ')}
              </span>
            </div>
          </div>
        );
      })}

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

export default ProjectGrid;
