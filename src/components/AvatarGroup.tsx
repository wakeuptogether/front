import type { User } from '../types';
import Avatar from './Avatar';
import './AvatarGroup.css';

interface AvatarGroupProps {
  users: User[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarGroup({ users, max = 4, size = 'md' }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="avatar-group">
      {visible.map((user) => (
        <Avatar key={user.id} name={user.name} src={user.avatarUrl} size={size} />
      ))}
      {overflow > 0 && (
        <div className={`avatar-group__overflow avatar avatar--${size}`}>
          +{overflow}
        </div>
      )}
    </div>
  );
}
