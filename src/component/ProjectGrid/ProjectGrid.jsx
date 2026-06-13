import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import ProjectCard from '../ProjectCard/ProjectCard.jsx';
import ProjectLightroom from '../ProjectLightroom/ProjectLightroom.jsx';
import './ProjectGrid.css';

const resolveSrc = (path) =>
  path ? `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}` : '';

const matchesCategory = (project, category) =>
  category === 'ALL' || (project.category ?? []).includes(category);

function ProjectGrid({ projects = [], activeCategory = 'ALL' }) {
  const [activeProject, setActiveProject] = useState(null);
  const [originRect, setOriginRect] = useState(null);
  const rootRef = useRef(null);
  const clickedElRef = useRef(null);

  const visible = projects.filter((p) => matchesCategory(p, activeCategory));

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
      {visible.map((project, i) => (
        <ProjectCard
          key={project.id ?? i}
          number={i + 1}
          image={resolveSrc(project.filePath?.main)}
          className="project-grid__card"
          onClick={(e) => openProject(project, e.currentTarget)}
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

export default ProjectGrid;
