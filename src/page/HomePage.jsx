import { useEffect, useMemo, useRef, useState } from 'react';
import Marquee from '../component/Marquee/Marquee.jsx';
import Catalog from '../component/Catalog/Catalog.jsx';
import ProjectLightroom from '../component/ProjectLightroom/ProjectLightroom.jsx';
import Toast from '../component/Toast/Toast.jsx';
import './HomePage.css';

const NY_CLOCK = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const EMAIL = 'mayuehan0420@gmail.com';
const INSTAGRAM_URL = 'https://www.instagram.com/selinayh__/';
const LINKEDIN_URL = 'https://www.linkedin.com/in/yuehan-ma-611ba9324/';

const resolveSrc = (path) => {
  if (!path) return '';
  const clean = path.replace(/^\//, '');
  const encoded = clean.split('/').map(encodeURIComponent).join('/');
  return `${import.meta.env.BASE_URL}${encoded}`;
};

const matchesCategory = (project, category) =>
  category === 'ALL' || (project.category ?? []).includes(category);

function HomePage() {
  const [projects, setProjects] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [toast, setToast] = useState('');

  const [view, setView] = useState('list'); // 'list' | 'grid'
  const [clock, setClock] = useState(() => NY_CLOCK.format(new Date()));
  const [activeProject, setActiveProject] = useState(null);
  const [originRect, setOriginRect] = useState(null);
  const [preview, setPreview] = useState({ src: '', cx: 0, cy: 0, visible: false });

  const toastTimer = useRef(null);
  const clickedElRef = useRef(null);
  const infoRef = useRef(null);

  useEffect(() => {
    const tick = () => setClock(NY_CLOCK.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}assets/works/project.json`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects ?? []);
        setCategoryOrder(data.categoryOrder ?? []);
      })
      .catch(() => {
        setProjects([]);
        setCategoryOrder([]);
      });
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    projects.forEach((p) =>
      (p.category ?? []).forEach((c) => {
        if (c) set.add(c);
      }),
    );
    const ordered = categoryOrder.filter((c) => set.has(c));
    const extras = [...set].filter((c) => !categoryOrder.includes(c));
    return ['ALL', ...ordered, ...extras];
  }, [projects, categoryOrder]);

  const visible = useMemo(
    () => projects.filter((p) => matchesCategory(p, activeCategory)),
    [projects, activeCategory],
  );

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      /* clipboard unavailable; still show the toast */
    }
    setToast('Email copied to clipboard');
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2000);
  };

  const showPreview = (project, el) => {
    if (window.matchMedia('(hover: none)').matches) return;
    const src = resolveSrc(project.filePath?.main);
    if (!src || !el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Random offset around the CENTER of this marquee container.
    const ox = (Math.random() - 0.5) * r.width * 0.3;
    const oy = (Math.random() - 0.5) * r.height * 0.55;
    let cx = r.left + r.width / 2 + ox;
    let cy = r.top + r.height / 2 + oy;
    const pad = 72;
    cx = Math.min(Math.max(cx, pad), vw - pad);
    cy = Math.min(Math.max(cy, pad), vh - pad);
    setPreview({ src, cx, cy, visible: true });
  };

  const hidePreview = () =>
    setPreview((p) => ({ ...p, visible: false }));

  const openProject = (project, el) => {
    hidePreview();
    clickedElRef.current = el;
    if (el) el.style.visibility = 'hidden';
    setOriginRect(el ? el.getBoundingClientRect() : null);
    setActiveProject(project);
  };

  const closeProject = () => {
    if (clickedElRef.current) {
      clickedElRef.current.style.visibility = '';
      clickedElRef.current = null;
    }
    setActiveProject(null);
  };

  const scrollTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  const scrollToInfo = () =>
    infoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="site">
      <header className="site__head">
        <div className="site__head-left">
          <button type="button" className="site__brand" onClick={scrollTop}>
            Yuehan Ma
          </button>
          <span className="site__role">Designer — New York</span>
        </div>

        <time className="site__clock" dateTime={new Date().toISOString()}>
          {clock}
        </time>

        <nav className="site__nav">
          <button type="button" className="site__nav-link" onClick={scrollToInfo}>
            Information
          </button>
          <button type="button" className="site__nav-link" onClick={copyEmail}>
            Email
          </button>
          <a
            className="site__nav-link"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            IG
          </a>
        </nav>
      </header>

      <main className="index">
        <div className="index__filter">
          <div className="index__filter-cats">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`index__filter-item${cat === activeCategory ? ' is-active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'ALL' ? 'All Work' : cat}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="index__filter-item index__filter-toggle"
            onClick={() => {
              hidePreview();
              setView((v) => (v === 'grid' ? 'list' : 'grid'));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {view === 'grid' ? 'Show as list' : 'Show in grid'}
          </button>
        </div>

        {view === 'grid' ? (
          <Catalog projects={visible} onOpen={openProject} />
        ) : (
          <div className="index__rows">
            {visible.map((project, i) => (
              <Marquee
                key={project.id ?? i}
                text={project.name}
                direction="left"
                speed={62 + (i % 3) * 10}
                onClick={(e) => openProject(project, e.currentTarget)}
                onMouseEnter={(e) => showPreview(project, e.currentTarget)}
                onMouseLeave={hidePreview}
              />
            ))}
            {visible.length === 0 && (
              <p className="index__empty">No projects in this category.</p>
            )}
          </div>
        )}
      </main>

      <section className="info" id="information" ref={infoRef}>
        <div className="info__grid">
          <div className="info__cell info__cell--contact">
            <h2 className="info__label">Contact</h2>
            <div className="info__body">
              <p className="info__address">
                New York, NY
                <br />
                United States
              </p>
              <p className="info__spacer">
                <button type="button" className="info__link" onClick={copyEmail}>
                  {EMAIL}
                </button>
                <br />
                <a
                  className="info__link"
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @selinayh__
                </a>
                <br />
                <a
                  className="info__link"
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
                <br />
                <a
                  className="info__link"
                  href={`${import.meta.env.BASE_URL}assets/cv.pdf`}
                  download
                >
                  CV
                </a>
              </p>
            </div>
          </div>

          <div className="info__cell info__cell--studio">
            <h2 className="info__label">Short &amp; Sweet</h2>
            <div className="info__body">
              <p>
                Yuehan is a Chinese designer and creative content creator based
                in New York. Her work blends code, culture, and communication to
                craft interactive and visual experiences that foster human
                connection.
              </p>
            </div>
          </div>

          <div className="info__cell info__cell--about">
            <h2 className="info__label">Approach</h2>
            <div className="info__body">
              <p>
                Working across editorial design, print, type and creative
                coding, Yuehan treats each project as a system — where
                typography, rhythm and structure carry the concept.
              </p>
              <p className="info__tagline">She is open for commission and freelance work：）</p>
            </div>
          </div>

          <div className="info__cell info__cell--exhibitions">
            <h2 className="info__label">Exhibitions &amp; Fair</h2>
            <ul className="info__body info__list">
              <li>
                <a className="info__item-link" href="https://nycxdesign.org/events/parsons-x-impact-seaport-satellite" target="_blank" rel="noopener noreferrer">Parsons x Impact NYCxDesign</a>, New York, NY (2026)
              </li>
              <li>
                <a className="info__item-link" href="https://brooklynfineartprintfair.com/" target="_blank" rel="noopener noreferrer">Brooklyn Fine Art Print Fair</a>, New York, NY (2026)
              </li>
              <li>
                <a className="info__item-link" href="https://imurart.com/" target="_blank" rel="noopener noreferrer">IMUR Gallery</a>, Jersey City, NJ (2025)
              </li>
              <li>
                <a className="info__item-link" href="https://event.newschool.edu/offsetartbookfair" target="_blank" rel="noopener noreferrer">Offset Art Book Fair</a>, New York, NY (2025)
              </li>
              <li>
                <a className="info__item-link" href="https://event.newschool.edu/spittingimagebookfair2025" target="_blank" rel="noopener noreferrer">Spitting Image Art Book Fair</a>, New York, NY (2025)
              </li>
              <li>
                <a className="info__item-link" href="https://www.aspacegallery.net/" target="_blank" rel="noopener noreferrer">A Space Gallery</a>, Brooklyn, NY (2024)
              </li>
              <li>
                <a className="info__item-link" href="https://parsons.edu/printandbook/" target="_blank" rel="noopener noreferrer">Printmaking and Book Arts Fair</a>, New York, NY (2024)
              </li>
            </ul>
          </div>

          <div className="info__cell info__cell--experiences">
            <h2 className="info__label">Experiences</h2>
            <ul className="info__body info__list">
              <li>
                <a className="info__item-link" href="https://www.carolpeligian.com/index.html" target="_blank" rel="noopener noreferrer">Carol Peligian Studio</a>, Studio Assistant(2025 - 2026)
                <ul className="info__list info__list--sub">
                  <li>Visual Content, Studio Management</li>
                </ul>
              </li>
              <li>
                <a className="info__item-link" href="https://www.aspacegallery.net/" target="_blank" rel="noopener noreferrer">A Space Gallery</a>, Visual Designer (2025 - 2026)
                <ul className="info__list info__list--sub">
                  <li>Exhibition Coordination, Visual Content</li>
                </ul>
              </li>
              <li>
                <a className="info__item-link" href="https://joinhandshake.com/about/" target="_blank" rel="noopener noreferrer">Handshake AI</a>, Design Intern (2026)
                <ul className="info__list info__list--sub">
                  <li>AI Model Evaluation, Visual Quality Assurance</li>
                </ul>
              </li>
              <li>
                <a className="info__item-link" href="https://www.romeohunte.com/" target="_blank" rel="noopener noreferrer">Romeo Hunte</a>, Design Intern (2025)
                <ul className="info__list info__list--sub">
                  <li>Digital Marketing, NYFW Preparation</li>
                </ul>
              </li>
              <li>
                <a className="info__item-link" href="https://thestylethatbindsus.com/" target="_blank" rel="noopener noreferrer">The Style That Binds Us</a>, Graphic Design Intern (2025)
                <ul className="info__list info__list--sub">
                  <li>Brand Design, Content Creation</li>
                </ul>
              </li>
              <li>
                <a className="info__item-link" href="https://www.lattini.com/" target="_blank" rel="noopener noreferrer">Lattini</a>, Social & Marketing Intern (2025)
                <ul className="info__list info__list--sub">
                  <li>Social Media, Campaign Strategy</li>
                </ul>
              </li>
              <li>
                <a className="info__item-link" href="" target="_blank" rel="noopener noreferrer">Hong Kang China Life</a>, Design Intern (2024)
                <ul className="info__list info__list--sub">
                  <li>Market Research, Design Strategy</li>
                </ul>
              </li>
              <li>
                <a className="info__item-link" href="https://www.atamianhovsepian.art/" target="_blank" rel="noopener noreferrer">Atamian Hovsepian Curatorial Practice</a>, Gallery Assistant (2024)
                <ul className="info__list info__list--sub">
                  <li>Gallery Operations, Artist Relations</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>

        <footer className="site__footer">
          Yuehan Ma — New York · © {new Date().getFullYear()}
        </footer>
      </section>

      {/* Floating hover preview — sits above all marquees, never affects layout */}
      <div
        className="preview"
        style={{
          left: `${preview.cx}px`,
          top: `${preview.cy}px`,
          opacity: preview.visible ? 1 : 0,
        }}
        aria-hidden="true"
      >
        {preview.src && (
          <img className="preview__img" src={preview.src} alt="" />
        )}
      </div>

      <ProjectLightroom
        project={activeProject}
        image={resolveSrc(activeProject?.filePath?.main)}
        originRect={originRect}
        isOpen={!!activeProject}
        onClose={closeProject}
      />
      <Toast message={toast} />
    </div>
  );
}

export default HomePage;
