import './ProjectCard.css';

function ProjectCard({ number, ref }) {
  return (
    <div ref={ref} className="project-card">
      <span>{number}</span>
    </div>
  );
}

export default ProjectCard;
