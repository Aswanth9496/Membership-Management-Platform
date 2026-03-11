import { Link } from 'react-router-dom'

const PortalCards = () => {
  return (
    <>
      <style>{`
        .portal-card {
          background: linear-gradient(145deg, rgba(15,32,68,.7), rgba(10,22,40,.9));
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 20px; padding: 48px 44px;
          position: relative; overflow: hidden;
          transition: all .35s; cursor: pointer;
          backdrop-filter: blur(12px);
        }
        .portal-card:hover {
          transform: translateY(-8px);
          border-color: rgba(37,99,235,.35);
          box-shadow: 0 32px 80px rgba(0,0,0,.5), 0 0 40px rgba(37,99,235,.12);
        }
        .card-chip {
          display: inline-block;
          background: rgba(37,99,235,.12);
          border: 1px solid rgba(37,99,235,.25);
          border-radius: 6px; padding: 5px 12px;
          font-size: 11px; font-weight: 500;
          color: #93c5fd; letter-spacing: .1em; text-transform: uppercase;
          margin-bottom: 24px;
        }
        .h-line {
          width: 48px; height: 2px;
          background: linear-gradient(90deg, #2563eb, #93c5fd);
          border-radius: 2px; margin: 18px auto;
        }
        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff; border: none; border-radius: 8px;
          padding: 13px 28px;
          font-family: 'Inter', sans-serif; font-weight: 500; font-size: 14px;
          letter-spacing: .04em; cursor: pointer;
          box-shadow: 0 0 30px rgba(37,99,235,.4);
          transition: all .25s; text-decoration: none; display: block;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 40px rgba(37,99,235,.65);
        }
        .btn-ghost {
          background: transparent; color: #cbd5e1;
          border: 1px solid rgba(255,255,255,.12); border-radius: 8px;
          padding: 13px 28px;
          font-family: 'Inter', sans-serif; font-weight: 400; font-size: 14px;
          letter-spacing: .04em; cursor: pointer; transition: all .25s;
          text-decoration: none; display: block;
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,.05);
          border-color: rgba(255,255,255,.25);
          color: #ffffff; transform: translateY(-2px);
        }
        @media (max-width: 900px) {
          .portal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <section style={{ padding:"100px 6%", background:"#070f1e" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }}>
            <h2 style={{ 
              fontFamily:"'Syne',sans-serif", 
              fontSize:"clamp(32px,5vw,52px)", 
              fontWeight:700, color:"#fff", 
              letterSpacing:"-.02em", marginBottom:14 
            }}>
              Choose Your Portal
            </h2>
            <div className="h-line" />
            <p style={{ 
              color:"#64748b", fontSize:15, 
              maxWidth:420, margin:"0 auto" 
            }}>Two dedicated portals, one unified platform.</p>
          </div>

          <div className="portal-grid" style={{ 
            display:"grid", 
            gridTemplateColumns:"repeat(2,1fr)", 
            gap:24 
          }}>

            {/* Admin */}
            <div className="portal-card">
              <div style={{ 
                position:"absolute", top:-60, right:-60, 
                width:220, height:220, borderRadius:"50%", 
                background:"radial-gradient(circle, rgba(37,99,235,.1), transparent 70%)", 
                pointerEvents:"none" 
              }} />
              <div className="card-chip">Administrator</div>
              <div style={{ fontSize:48, marginBottom:20 }}>🏛️</div>
              <h3 style={{ 
                fontFamily:"'Syne',sans-serif", fontSize:30, 
                fontWeight:700, color:"#fff", 
                marginBottom:14, letterSpacing:"-.02em" 
              }}>Admin Portal</h3>
              <p style={{ 
                color:"#94a3b8", fontSize:15, 
                lineHeight:1.75, marginBottom:36 
              }}>
                Full control over the platform. Manage members, oversee events, configure settings, and access powerful analytics — all in one place.
              </p>
              <ul style={{ listStyle:"none", marginBottom:44 }}>
                {["Member management & roles","Event creation & scheduling","Analytics & reporting","System configuration"].map(item => (
                  <li key={item} style={{ 
                    color:"#94a3b8", fontSize:14, padding:"10px 0", 
                    borderBottom:"1px solid rgba(255,255,255,.05)", 
                    display:"flex", alignItems:"center", gap:12 
                  }}>
                    <span style={{ 
                      width:6, height:6, borderRadius:"50%", 
                      background:"#3b82f6", display:"inline-block", 
                      flexShrink:0, boxShadow:"0 0 8px #3b82f6" 
                    }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link 
                to="/admin/login" 
                className="btn-ghost" 
                style={{ 
                  width:"100%", textAlign:"center", 
                  borderColor:"rgba(37,99,235,.3)", 
                  color:"#93c5fd" 
                }}
              >
                Enter Admin Portal →
              </Link>
            </div>

            {/* Member */}
            <div className="portal-card" style={{ borderColor:"rgba(37,99,235,.15)" }}>
              <div style={{ 
                position:"absolute", top:-60, right:-60, 
                width:220, height:220, borderRadius:"50%", 
                background:"radial-gradient(circle, rgba(59,130,246,.12), transparent 70%)", 
                pointerEvents:"none" 
              }} />
              <div className="card-chip" style={{ 
                background:"rgba(59,130,246,.15)", 
                borderColor:"rgba(59,130,246,.3)" 
              }}>Member</div>
              <div style={{ fontSize:48, marginBottom:20 }}>🌐</div>
              <h3 style={{ 
                fontFamily:"'Syne',sans-serif", fontSize:30, 
                fontWeight:700, color:"#fff", 
                marginBottom:14, letterSpacing:"-.02em" 
              }}>Member Portal</h3>
              <p style={{ 
                color:"#94a3b8", fontSize:15, 
                lineHeight:1.75, marginBottom:36 
              }}>
                Your personal community space. Browse events, manage your profile, connect with fellow members, and stay on top of all activities.
              </p>
              <ul style={{ listStyle:"none", marginBottom:44 }}>
                {["Personal profile & settings","Event registration","Community activities","Membership services"].map(item => (
                  <li key={item} style={{ 
                    color:"#94a3b8", fontSize:14, padding:"10px 0", 
                    borderBottom:"1px solid rgba(255,255,255,.05)", 
                    display:"flex", alignItems:"center", gap:12 
                  }}>
                    <span style={{ 
                      width:6, height:6, borderRadius:"50%", 
                      background:"#93c5fd", display:"inline-block", 
                      flexShrink:0, boxShadow:"0 0 8px rgba(147,197,253,.5)" 
                    }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link 
                to="/member/login" 
                className="btn-primary" 
                style={{ width:"100%", textAlign:"center" }}
              >
                Enter Member Portal →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PortalCards;
