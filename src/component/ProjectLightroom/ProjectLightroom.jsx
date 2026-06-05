import './ProjectLightroom.css';

const crossIcon = `${import.meta.env.BASE_URL}assets/icons/cross.svg`;

function ProjectLightroom({ project, image, isOpen, onClose }) {
  if (!isOpen || !project) return null;

  return (
    <div className="project-lightroom" onClick={onClose}>
      <button
        type="button"
        className="project-lightroom__close"
        onClick={onClose}
      >
        <img src={crossIcon} alt="Close" />
      </button>
      {image ? (
        <img
          className="project-lightroom__img"
          src={image}
          alt={project.name}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="project-lightroom__title"
          onClick={(e) => e.stopPropagation()}
        >
          {project.name}
        </span>
      )}
    </div>
  );
}

export default ProjectLightroom;
