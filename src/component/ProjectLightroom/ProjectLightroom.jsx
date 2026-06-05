import './ProjectLightroom.css';

function ProjectLightroom({ project, isOpen, onClose }) {
  if (!isOpen || !project) return null;

  return (
    <div className="project-lightroom" onClick={onClose}>
      <div
        className="project-lightroom__content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="project-lightroom__close"
          onClick={onClose}
        >
          Close
        </button>
        <h2 className="project-lightroom__title">{project.name}</h2>
      </div>
    </div>
  );
}

export default ProjectLightroom;
