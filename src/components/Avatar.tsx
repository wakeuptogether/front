import './Avatar.css';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLORS = [
  '#5A9EFF', '#4CAF50', '#FF9800', '#E91E63',
  '#9C27B0', '#00BCD4', '#FF5722', '#607D8B',
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string) {
  return name.slice(0, 1);
}

export default function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const bg = getColor(name);

  return (
    <div
      className={`avatar avatar--${size} ${className}`}
      style={{ backgroundColor: src ? 'transparent' : bg }}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="avatar__img" />
      ) : (
        <span className="avatar__initials">{getInitials(name)}</span>
      )}
    </div>
  );
}
