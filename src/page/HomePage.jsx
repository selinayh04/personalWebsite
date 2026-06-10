import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, splitText, stagger } from 'animejs';
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
  const [revealed, setRevealed] = useState(false);
  const toastTimer = useRef(null);

  const [projects, setProjects] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');

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

  useEffect(() => {
    const targets = [
      document.querySelector('.home-page__name'),
      ...document.querySelectorAll('.home-page__link'),
    ].filter(Boolean);

    const splits = targets.map((el) =>
      splitText(el, { chars: { wrap: 'clip' } }),
    );
    const chars = splits.flatMap((s) => s.chars);
    // Idle animation only runs on the name (first target).
    const nameChars = splits[0] ? splits[0].chars : [];

    let firstTimer = null;
    let idleTimer = null;

    // Idle standby: a random letter slides out and the same one slides back in.
    const playRandom = () => {
      const char = nameChars[Math.floor(Math.random() * nameChars.length)];
      if (char) {
        animate(char, {
          y: [
            { to: '-100%', duration: 750, ease: 'in(3)' },
            { to: ['100%', '0%'], duration: 750, ease: 'out(3)' },
          ],
        });
      }
      idleTimer = setTimeout(playRandom, 2000 + Math.random() * 1000);
    };

    animate(chars, {
      y: [{ to: ['100%', '0%'] }],
      duration: 550,
      ease: 'outCubic',
      delay: stagger(60),
      onComplete: () => {
        setRevealed(true);
        firstTimer = setTimeout(playRandom, 4000);
      },
    });

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(idleTimer);
      splits.forEach((s) => s.revert());
    };
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
    return [...ordered, ...extras];
  }, [projects, categoryOrder]);

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
            {revealed && (
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
            )}
          </div>

          <div
            className="home-page__group"
            onMouseEnter={() => setOpen('contact', true)}
            onMouseLeave={() => setOpen('contact', false)}
          >
            <button type="button" className="home-page__link">
              Contact
            </button>
            {revealed && (
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
            )}
          </div>
        </nav>
      </header>

      <ScrollStage projects={projects} activeCategory={activeCategory} />
      <Toast message={toast} />
    </section>
  );
}

export default HomePage;
