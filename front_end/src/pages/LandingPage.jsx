import Header from '../components/common/Header'
import Hero from '../components/common/Hero'
import PortalCards from '../components/common/PortalCards'
import Footer from '../components/common/Footer'

const LandingPage = () => {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#050d1a", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
      `}</style>

      <Header />
      <Hero />
      <PortalCards />
      <Footer />
    </div>
  );
};

export default LandingPage;