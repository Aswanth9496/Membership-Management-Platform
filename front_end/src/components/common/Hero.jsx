const Hero = () => {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-pulse {
          0%,100% { opacity: .5; }
          50%      { opacity: 1; }
        }
        .a1 { animation: fadeUp .9s ease both; }
        .a2 { animation: fadeUp .9s .2s ease both; }
        .a3 { animation: fadeUp .9s .4s ease both; }
        .orb {
          position: absolute; border-radius: 50%;
          filter: blur(90px); pointer-events: none;
          animation: glow-pulse 5s ease-in-out infinite;
        }
        .dot-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(37,99,235,.15) 1px, transparent 1px);
          background-size: 40px 40px; pointer-events: none;
        }
      `}</style>

      <section style={{ 
        position:"relative", 
        minHeight:"70vh", // Reduced from 100vh
        display:"flex", 
        alignItems:"center", 
        padding:"100px 6% 80px", // Reduced padding
        overflow:"hidden" 
      }}>
        <div className="dot-grid" />
        <div className="orb" style={{ 
          width:600, height:600, top:-150, right:-100, 
          background:"rgba(37,99,235,.18)" 
        }} />
        <div className="orb" style={{ 
          width:400, height:400, bottom:0, left:"5%", 
          background:"rgba(14,51,140,.2)", animationDelay:"2.5s" 
        }} />
        <div style={{ 
          position:"absolute", top:"50%", left:0, right:0, height:1, 
          background:"linear-gradient(90deg, transparent, rgba(37,99,235,.25) 30%, rgba(59,130,246,.35) 50%, rgba(37,99,235,.25) 70%, transparent)", 
          pointerEvents:"none" 
        }} />

        <div style={{ 
          maxWidth:1280, margin:"0 auto", width:"100%", 
          position:"relative", zIndex:1 
        }}>
          <h1 className="a2" style={{
            fontFamily:"'Syne',sans-serif",
            fontSize:"clamp(44px,7.5vw,92px)",
            fontWeight:800, lineHeight:1.0,
            letterSpacing:"-.03em", color:"#fff", marginBottom:28
          }}>
            The Home for<br />
            <span style={{ color:"#3b82f6" }}>Task</span>
            <span style={{ color:"#94a3b8", fontWeight:300 }}> Community.</span>
          </h1>

          <p className="a3" style={{
            color:"#94a3b8", fontSize:"clamp(15px,1.8vw,18px)",
            fontWeight:300, lineHeight:1.8, maxWidth:520, marginBottom:44
          }}>
            Manage members, run events, and streamline administrative tasks — all inside one clean, powerful platform.
          </p>
        </div>

        <div style={{ 
          position:"absolute", right:"4%", top:"52%", 
          transform:"translateY(-50%)", fontFamily:"'Syne',sans-serif", 
          fontWeight:800, fontSize:"clamp(100px,18vw,240px)", 
          color:"rgba(37,99,235,.04)", lineHeight:1, 
          pointerEvents:"none", userSelect:"none", 
          letterSpacing:"-.04em" 
        }}>TC</div>
      </section>
    </>
  );
};

export default Hero;
