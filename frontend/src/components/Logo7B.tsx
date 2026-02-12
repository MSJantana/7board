export const Logo7B = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 256 256" 
    aria-label="Logo 7B"
    width="120"
    height="120"
  >
    <defs>
      {/* Fundo escuro com leve profundidade */}
      <linearGradient id="bg" x1="40" y1="30" x2="220" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#0B1630"/>
        <stop offset="1" stopColor="#070E1E"/>
      </linearGradient>

      {/* Sombra suave interna (bem discreta) */}
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.25"/>
      </filter>
    </defs>

    {/* App icon container */}
    <rect x="18" y="18" width="220" height="220" rx="54" fill="url(#bg)" filter="url(#soft)"/>

    {/* Traço curvo superior (ciano) */}
    <path d="M78 70 C94 58, 120 56, 140 60"
          fill="none" stroke="#36C6FF" strokeWidth="12"
          strokeLinecap="round"/>

    {/* Barras horizontais (ciano / verde / lilás) */}
    <g strokeLinecap="round" strokeWidth="14" fill="none">
      <path d="M78 112 H132" stroke="#36C6FF"/>
      <path d="M78 138 H124" stroke="#22D3A6"/>
      <path d="M78 164 H118" stroke="#A9A7FF"/>
    </g>

    {/* "7" branco em destaque */}
    <path d="M150 96 H194 L166 202"
          fill="none" stroke="#FFFFFF" strokeWidth="14"
          strokeLinecap="round" strokeLinejoin="round"/>

    {/* "B" discreto (assinatura 7B) */}
    <g fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.92">
      {/* haste */}
      <path d="M176 168 V206"/>
      {/* duas “barrigas” do B */}
      <path d="M176 170 H194 C206 170 206 186 194 186 H176"/>
      <path d="M176 188 H196 C210 188 210 206 196 206 H176"/>
    </g>
  </svg>
);
