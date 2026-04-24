import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './page/HomePage.jsx';
import WorksPage from './page/WorksPage.jsx';
import ContactPage from './page/ContactPage.jsx';

function App() {
  return (
    <div className="app">
      <nav className="app__nav">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/works">Works</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </nav>
      <main className="app__main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/works" element={<WorksPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
