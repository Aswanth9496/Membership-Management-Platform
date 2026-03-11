const Footer = () => {
  return (
    <>
      <style>{`
        .logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 16px; color: #ffffff; letter-spacing: -.01em;
        }
        .logo-icon {
          width: 28px; height: 28px; border-radius: 10px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          box-shadow: 0 0 20px rgba(37,99,235,.5);
        }
        .logo-blue { color: #3b82f6; }
      `}</style>

      <footer style={{ 
        borderTop:"1px solid rgba(255,255,255,.06)", 
        padding:"36px 6%", 
        display:"flex", 
        justifyContent:"space-between", 
        alignItems:"center", 
        flexWrap:"wrap", 
        gap:16, 
        background:"#050d1a" 
      }}>
        <div className="logo">
          <div className="logo-icon">🌊</div>
          Task<span className="logo-blue">Community</span>
        </div>
        <div style={{ display:"flex", gap:28 }}>
          {["Privacy","Terms","Support"].map(l => (
            <a 
              key={l} 
              href="#" 
              style={{ 
                color:"#475569", 
                fontFamily:"'Inter',sans-serif", 
                fontSize:13, 
                textDecoration:"none" 
              }}
              onMouseEnter={e => e.target.style.color="#fff"}
              onMouseLeave={e => e.target.style.color="#475569"}
            >{l}</a>
          ))}
        </div>
        <div style={{ 
          color:"#334155", fontSize:12, 
          letterSpacing:".08em", 
          fontFamily:"'Inter',sans-serif" 
        }}>
          © 2026 TaskCommunity
        </div>
      </footer>
    </>
  );
};

export default Footer;
