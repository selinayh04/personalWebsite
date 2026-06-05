import './ProjectCard.css';

function ProjectCard({ number, image, onClick, ref }) {
  return (
    <div ref={ref} className="project-card" onClick={onClick}>
      {image ? (
        <img className="project-card__img" src={image} alt="" />
      ) : (
        <span>{number}</span>
      )}
    </div>
  );
}

export default ProjectCard;
