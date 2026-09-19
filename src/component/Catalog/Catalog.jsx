import './Catalog.css';

const VIDEO_EXTS = /\.(mp4|mov|webm)$/i;

const hideBroken = (e) => {
  e.currentTarget.style.display = 'none';
};

const resolveSrc = (path) => {
  if (!path) return '';
  const clean = path.replace(/^\//, '');
  const encoded = clean.split('/').map(encodeURIComponent).join('/');
  return `${import.meta.env.BASE_URL}${encoded}`;
};

const CATALOG_ONLY = {
  '2': [
    'assets/works/THE LOOP/image/3.jpg',
    'assets/works/THE LOOP/image/4.jpg',
    'assets/works/THE LOOP/image/7.mov',
    'assets/works/THE LOOP/image/6.jpg',
    'assets/works/THE LOOP/image/5.jpg',
  ],
};

const projectMedia = (project) => {
  if (CATALOG_ONLY[project.id]) {
    return CATALOG_ONLY[project.id].map(resolveSrc);
  }
  const main = project.filePath?.main;
  const extra = (project.filePath?.additional ?? []).filter(Boolean);
  const all = [main, ...extra].filter(Boolean).map(resolveSrc);
  // Skip oversized GIFs in the grid (Fire Hydrant main.gif).
  const withoutGif = all.filter((src) => !/\.gif$/i.test(src));
  return withoutGif.length ? withoutGif : all;
};

function Catalog({ projects = [], onOpen }) {
  return (
    <div className="catalog">
      {projects.map((project, i) => {
        const media = projectMedia(project);
        return (
          <article
            key={project.id ?? i}
            className="catalog__card"
            onClick={(e) => onOpen?.(project, e.currentTarget)}
          >
            <header className="catalog__head">
              <span className="catalog__name">{project.name}</span>
              <span className="catalog__medium">{project.medium || ''}</span>
              <span className="catalog__year">{project.date || ''}</span>
            </header>

            <div className="catalog__body">
              <div
                className={
                  project.id === '2'
                    ? 'catalog__photos catalog__photos--masonry'
                    : 'catalog__photos'
                }
              >
                {media.map((src, k) =>
                  VIDEO_EXTS.test(src) ? (
                    <video
                      key={k}
                      className="catalog__media"
                      src={src}
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      key={k}
                      className="catalog__media"
                      src={src}
                      alt={project.name}
                      onError={hideBroken}
                    />
                  ),
                )}
              </div>
              {project.description && (
                <p className="catalog__desc">{project.description}</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default Catalog;
