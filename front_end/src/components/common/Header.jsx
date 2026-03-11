import { useState, useEffect } from "react";

const Header = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          padding: 0 6%;
          background: rgba(5,13,26,0.7);
          backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(37,99,235,.12);
          transition: all .3s;
        }
        .nav.scrolled {
          background: rgba(5,13,26,.97);
          border-color: rgba(37,99,235,.28);
        }
        .nav-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 68px;
        }
        .logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 19px; color: #ffffff; letter-spacing: -.01em;
        }
        .logo-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          box-shadow: 0 0 20px rgba(37,99,235,.5);
        }
        .logo-blue { color: #3b82f6; }
      `}</style>

      <nav className={`nav ${scrollY > 50 ? "scrolled" : ""}`}>
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-icon">🌊</div>
            Task<span className="logo-blue">Community</span>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
