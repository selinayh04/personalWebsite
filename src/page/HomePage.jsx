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
  const nameCharsRef = useRef([]);
  const sortCharsRef = useRef([]);
  const taglineWordsRef = useRef([]);

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
    nameCharsRef.current = splits.flatMap((s) => s.chars);

    animate(
      splits.flatMap((s) => s.chars),
      {
        y: [{ to: ['100%', '0%'] }],
        duration: 550,
        ease: 'outCubic',
        delay: stagger(60),
        onComplete: () => setRevealed(true),
      },
    );

    return () => splits.forEach((s) => s.revert());
  }, []);

  // Idle "screensaver": after 20s of no activity, all header words detach and
  // bounce around the screen like a DVD logo until the user interacts again.
  useEffect(() => {
    const idle = { active: false, timer: null, states: [] };

    const segment = (s) => {
      if (!idle.active) return;
      const maxX = Math.max(0, window.innerWidth - s.w);
      const maxY = Math.max(0, window.innerHeight - s.h);
      s.x = Math.min(Math.max(s.x, 0), maxX);
      s.y = Math.min(Math.max(s.y, 0), maxY);
      const tx =
        s.vx > 0 ? (maxX - s.x) / (s.vx * s.speed)
        : s.vx < 0 ? (0 - s.x) / (s.vx * s.speed)
        : Infinity;
      const ty =
        s.vy > 0 ? (maxY - s.y) / (s.vy * s.speed)
        : s.vy < 0 ? (0 - s.y) / (s.vy * s.speed)
        : Infinity;
      const t = Math.max(16, Math.min(tx, ty));
      const nx = s.x + s.vx * s.speed * t;
      const ny = s.y + s.vy * s.speed * t;
      s.anim = animate(s.el, {
        translateX: [s.x, nx],
        translateY: [s.y, ny],
        duration: t,
        ease: 'linear',
        onComplete: () => {
          s.x = nx;
          s.y = ny;
          if (tx <= ty) s.vx = -s.vx;
          if (ty <= tx) s.vy = -s.vy;
          segment(s);
        },
      });
    };

    const enterIdle = () => {
      const allEls = [
        ...nameCharsRef.current,
        ...sortCharsRef.current,
        ...taglineWordsRef.current.filter(Boolean),
      ];
      if (idle.active || allEls.length === 0) return;
      idle.active = true;
      idle.states = allEls.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          el,
          homeX: r.left,
          homeY: r.top,
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
          vx: Math.random() < 0.5 ? -1 : 1,
          vy: Math.random() < 0.5 ? -1 : 1,
          speed: 0.07 + Math.random() * 0.06,
          anim: null,
        };
      });
      idle.states.forEach((s) => {
        s.el.style.position = 'fixed';
        s.el.style.left = '0px';
        s.el.style.top = '0px';
        s.el.style.margin = '0';
        s.el.style.willChange = 'transform';
        s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
        segment(s);
      });

    };

    const exitIdle = () => {
      if (!idle.active) return;
      idle.active = false;
      idle.states.forEach((s) => {
        s.anim?.pause();
        animate(s.el, {
          translateX: s.homeX,
          translateY: s.homeY,
          duration: 400,
          ease: 'outCubic',
          onComplete: () => {
            s.el.style.position = '';
            s.el.style.left = '';
            s.el.style.top = '';
            s.el.style.margin = '';
            s.el.style.willChange = '';
            s.el.style.transform = '';
          },
        });
      });
      idle.states = [];
    };

    const reset = () => {
      if (idle.active) exitIdle();
      clearTimeout(idle.timer);
      idle.timer = setTimeout(enterIdle, 20000);
    };

    const events = ['mousemove', 'wheel', 'scroll', 'keydown', 'pointerdown', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    idle.timer = setTimeout(enterIdle, 20000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, reset));
      clearTimeout(idle.timer);
      idle.states.forEach((s) => s.anim?.pause());
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
          <p className="home-page__tagline">
            {'She is open for commission and freelance :)'.split('').map((char, i) => (
              <span
                key={i}
                ref={(el) => { taglineWordsRef.current[i] = el; }}
                className="home-page__tagline-char"
              >
                {char === ' ' ? '\u00a0' : char}
              </span>
            ))}
          </p>
          <Sort
            categories={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
            onCharsReady={(chars) => { sortCharsRef.current = chars; }}
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
              <a
                className="home-page__cv"
                href={`${import.meta.env.BASE_URL}assets/cv.pdf`}
                download
              >
                Download CV
              </a>
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
