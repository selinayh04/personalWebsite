import { useState } from 'react';
import ExpandablePanel from '../component/ExpandablePanel/ExpandablePanel.jsx';
import ScrollStage from '../component/ScrollStage/ScrollStage.jsx';
import './HomePage.css';

function HomePage() {
  const [openPanels, setOpenPanels] = useState({
    about: false,
    contact: false,
  });

  const setOpen = (panel, value) => {
    setOpenPanels((prev) => ({ ...prev, [panel]: value }));
  };

  return (
    <section className="home-page">
      <header className="home-page__header">
        <h1 className="home-page__name">Yuehan Ma</h1>
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
              <p>About placeholder — short bio goes here.</p>
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
              <p>Contact placeholder — email, socials, etc.</p>
            </ExpandablePanel>
          </div>
        </nav>
      </header>

      <ScrollStage />
    </section>
  );
}

export default HomePage;
