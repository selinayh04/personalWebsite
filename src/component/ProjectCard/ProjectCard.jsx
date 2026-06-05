import './ProjectCard.css';

function ProjectCard({ number, image, onClick, ref, shiftRef }) {
  return (
    <div ref={ref} className="project-card" onClick={onClick}>
      <div ref={shiftRef} className="project-card__shift">
        <div className="project-card__inner">
          {image ? (
            <img className="project-card__img" src={image} alt="" />
          ) : (
            <span>{number}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
