import { useEffect, useMemo, useRef, useState } from 'react';
import ExpandablePanel from '../component/ExpandablePanel/ExpandablePanel.jsx';
import ScrollStage from '../component/ScrollStage/ScrollStage.jsx';
import Sort from '../component/Sort/Sort.jsx';
import Toast from '../component/Toast/Toast.jsx';
import './HomePage.css';

const EMAIL = 'mayuehan0420@gmail.com';
const INSTAGRAM_URL = 'https://www.instagram.com/selinayh__/';
const LINKEDIN_URL = 'https://www.linkedin.com/in/yuehan-ma-611ba9324/';

function HomePage() {
  const [openPanels, setOpenPanels] = useState({
    about: false,
    contact: false,
  });
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const [projects, setProjects] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}assets/works/project.json`)
      .then((res) => res.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]));
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    projects.forEach((p) =>
      (p.category ?? []).forEach((c) => {
        if (c) set.add(c);
      }),
    );
    return [...set];
  }, [projects]);

  const setOpen = (panel, value) => {
    setOpenPanels((prev) => ({ ...prev, [panel]: value }));
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      // clipboard not available; still show the toast
    }
    setToast('Email has been copied to clipboard');
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2000);
  };

  return (
    <section className="home-page">
      <header className="home-page__header">
        <div className="home-page__left">
          <h1 className="home-page__name">Yuehan Ma</h1>
          <Sort
            categories={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>
        <nav className="home-page__nav">
          <div
            className="home-page__group"
            onMouseEnter={() => setOpen('about', true)}
            onMouseLeave={() => setOpen('about', false)}
          >
            <button type="button" className="home-page__link">
              About
            </button>
            <ExpandablePanel
              isOpen={openPanels.about}
              className="home-page__panel"
            >
              <p>
                Yuehan is a Chinese designer and creative content creator based
                in New York. Her work blends code, culture, and communication to
                craft interactive and visual experiences that foster human
                connection.
              </p>
              <p>She is open for commission and freelance:)</p>
            </ExpandablePanel>
          </div>

          <div
            className="home-page__group"
            onMouseEnter={() => setOpen('contact', true)}
            onMouseLeave={() => setOpen('contact', false)}
          >
            <button type="button" className="home-page__link">
              Contact
            </button>
            <ExpandablePanel
              isOpen={openPanels.contact}
              className="home-page__panel"
            >
              <div className="home-page__links">
                <button
                  type="button"
                  className="home-page__contact-link"
                  onClick={copyEmail}
                >
                  Email
                </button>
                <a
                  className="home-page__contact-link"
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
                <a
                  className="home-page__contact-link"
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Linkedin
                </a>
              </div>
            </ExpandablePanel>
          </div>
        </nav>
      </header>

      <ScrollStage projects={projects} activeCategory={activeCategory} />
      <Toast message={toast} />
    </section>
  );
}

export default HomePage;
