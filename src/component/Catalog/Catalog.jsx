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

const projectMedia = (project) => {
  const main = project.filePath?.main;
  const extra = (project.filePath?.additional ?? []).filter(Boolean);
  const all = [main, ...extra].filter(Boolean).map(resolveSrc);
  // Huge animated GIFs (e.g. Fire Hydrant main.gif at 3672×4896) often
  // fail to decode as thumbnails and show a broken-image tile.
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
                  project.id === '1'
                    ? 'catalog__photos catalog__photos--pool'
                    : project.id === '2'
                      ? 'catalog__photos catalog__photos--masonry'
                      : 'catalog__photos'
                }
              >
                {project.id === '1' ? (
                  <>
                    <div className="catalog__photos-pair">
                      {media.slice(0, 2).map((src, k) => (
                        <img
                          key={k}
                          className="catalog__media"
                          src={src}
                          alt={project.name}
                          onError={hideBroken}
                        />
                      ))}
                    </div>
                    {media.slice(2).map((src, k) => (
                      <img
                        key={`tall-${k}`}
                        className="catalog__media catalog__media--tall"
                        src={src}
                        alt={project.name}
                        onError={hideBroken}
                      />
                    ))}
                  </>
                ) : (
                  media.map((src, k) =>
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
                  )
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
