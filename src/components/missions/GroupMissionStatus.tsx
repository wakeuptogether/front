import { motion } from 'framer-motion';
import type { MemberMissionStatus } from '../../types';
import Avatar from '../Avatar';
import './missions.css';

interface Props {
  members: MemberMissionStatus[];
  timeoutSeconds: number;
  maxSeconds: number;
}

export default function GroupMissionStatus({ members, timeoutSeconds, maxSeconds }: Props) {
  const allDone = members.length > 0 && members.every((m) => m.completed);
  const minutes = Math.floor(timeoutSeconds / 60);
  const seconds = timeoutSeconds % 60;
  const timePercent = (timeoutSeconds / maxSeconds) * 100;
  const isUrgent = timeoutSeconds <= 60;

  return (
    <div className="group-status">
      {/* 카운트다운 타이머 */}
      <div className={`group-status__timer ${isUrgent ? 'group-status__timer--urgent' : ''}`}>
        <div className="group-status__timer-bar">
          <motion.div
            className="group-status__timer-fill"
            animate={{ width: `${timePercent}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
        <span className="group-status__timer-text">
          {isUrgent ? '⚠️ ' : '⏰ '}
          {minutes}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      {/* 멤버 상태 리스트 */}
      <div className="group-status__members">
        <h3 className="group-status__title">
          {allDone ? '🎉 모두 완료!' : '그룹 멤버 현황'}
        </h3>
        {members.map((member) => (
          <motion.div
            key={member.userId}
            className={`group-status__member ${
              member.completed ? 'group-status__member--done' : ''
            }`}
            layout
          >
            <Avatar name={member.name} size="sm" />
            <span className="group-status__member-name">{member.name}</span>
            <div className="group-status__member-status">
              {member.completed ? (
                <motion.span
                  className="group-status__check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                >
                  ✅
                </motion.span>
              ) : (
                <span className="group-status__pending">
                  대기 중
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
