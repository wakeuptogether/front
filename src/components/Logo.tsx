import './Logo.css';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({ size = 48, showText = true }: LogoProps) {
  return (
    <div className="logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        className="logo__icon"
      >
        {/* Clock body */}
        <circle cx="32" cy="32" r="28" fill="url(#logoGrad)" opacity="0.15" />
        <circle cx="32" cy="32" r="24" stroke="url(#logoGrad)" strokeWidth="3" fill="none" />

        {/* Clock hands */}
        <line x1="32" y1="32" x2="32" y2="16" stroke="#5A9EFF" strokeWidth="3" strokeLinecap="round" />
        <line x1="32" y1="32" x2="42" y2="32" stroke="#A5CFFF" strokeWidth="2.5" strokeLinecap="round" />

        {/* Center dot */}
        <circle cx="32" cy="32" r="3" fill="#5A9EFF" />

        {/* People dots */}
        <circle cx="14" cy="50" r="5" fill="#4CAF50" opacity="0.8" />
        <circle cx="50" cy="50" r="5" fill="#FF9800" opacity="0.8" />
        <circle cx="32" cy="58" r="4" fill="#5A9EFF" opacity="0.6" />

        {/* Connection lines */}
        <line x1="14" y1="50" x2="32" y2="58" stroke="#4CAF50" strokeWidth="1.5" opacity="0.4" />
        <line x1="50" y1="50" x2="32" y2="58" stroke="#FF9800" strokeWidth="1.5" opacity="0.4" />

        <defs>
          <linearGradient id="logoGrad" x1="8" y1="8" x2="56" y2="56">
            <stop offset="0%" stopColor="#5A9EFF" />
            <stop offset="100%" stopColor="#A5CFFF" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <div className="logo__text">
          <span className="logo__title">같이 일어나</span>
          <span className="logo__subtitle">Wakeup Together</span>
        </div>
      )}
    </div>
  );
}
