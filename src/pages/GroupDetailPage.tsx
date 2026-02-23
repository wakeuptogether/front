import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Link2, Plus, Check, Repeat } from 'lucide-react';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import CircularProgress from '../components/CircularProgress';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import {
  groups, getGroupAlarms, getCompletionRate, formatTime,
} from '../data/mockData';
import type { DayOfWeek } from '../types';
import { useState } from 'react';
import './GroupDetailPage.css';


function getRepeatLabel(days: DayOfWeek[]): string {
  if (days.length === 7) return '매일';
  const weekdays: DayOfWeek[] = ['월', '화', '수', '목', '금'];
  if (days.length === 5 && weekdays.every((d) => days.includes(d))) return '평일';
  return days.join(', ');
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const group = groups.find((g) => g.id === id);
  const alarms = group ? getGroupAlarms(group.id) : [];
  const today = new Date().toISOString().split('T')[0];

  const [copiedInvite, setCopiedInvite] = useState(false);
  const [completedAlarms, setCompletedAlarms] = useState<Set<string>>(new Set());

  if (!group) {
    return (
      <div className="group-detail group-detail--not-found">
        <p>그룹을 찾을 수 없습니다.</p>
        <Button onClick={() => navigate('/dashboard')}>돌아가기</Button>
      </div>
    );
  }

  const handleCopyInvite = () => {
    navigator.clipboard?.writeText(group.inviteCode);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleComplete = (alarmId: string) => {
    setCompletedAlarms((prev) => {
      const next = new Set(prev);
      next.add(alarmId);
      return next;
    });
  };

  return (
    <div className="group-detail">
      {/* Header */}
      <header className="group-detail__header">
        <button className="group-detail__back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={22} />
        </button>
        <div className="group-detail__header-info">
          <h1 className="group-detail__name">{group.name}</h1>
          <span className="group-detail__member-count">{group.members.length}명 참여 중</span>
        </div>
        <button
          className={`group-detail__invite ${copiedInvite ? 'group-detail__invite--copied' : ''}`}
          onClick={handleCopyInvite}
        >
          {copiedInvite ? <Check size={16} /> : <Link2 size={16} />}
          {copiedInvite ? '복사됨!' : '초대'}
        </button>
      </header>

      {/* Members */}
      <div className="group-detail__members">
        {group.members.map((member) => (
          <div key={member.id} className="group-detail__member">
            <Avatar name={member.name} src={member.avatarUrl} size="md" />
            <span className="group-detail__member-name">{member.name}</span>
          </div>
        ))}
      </div>

      {/* Alarms */}
      <motion.div
        className="group-detail__alarms"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <h2 className="group-detail__section-title">알람 목록</h2>
        {alarms.map((alarm) => {
          const rate = getCompletionRate(alarm.id, group.id, today);
          const isDone = completedAlarms.has(alarm.id);
          return (
            <motion.div key={alarm.id} variants={item}>
              <Card
                className="group-detail__alarm-card"
                onClick={() => navigate(`/group/${group.id}/alarm/${alarm.id}`)}
                hoverable
              >
                <div className="group-detail__alarm-time">
                  {formatTime(alarm.hour, alarm.minute)}
                </div>

                <div className="group-detail__alarm-info">
                  <span className="group-detail__alarm-title">{alarm.title}</span>
                  <span className="group-detail__alarm-repeat">
                    <Repeat size={12} />
                    {getRepeatLabel(alarm.repeatDays)}
                  </span>
                </div>

                <div className="group-detail__alarm-right">
                  <CircularProgress
                    completed={isDone ? rate.completed + 1 : rate.completed}
                    total={rate.total}
                    size={44}
                    strokeWidth={3.5}
                  />
                  <motion.button
                    className={`group-detail__check ${isDone ? 'group-detail__check--done' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComplete(alarm.id);
                    }}
                    whileTap={{ scale: 0.85 }}
                    disabled={isDone}
                  >
                    <Check size={18} />
                  </motion.button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Add Alarm */}
      <div className="group-detail__add">
        <Button
          fullWidth
          icon={<Plus size={18} />}
          onClick={() => navigate(`/group/${group.id}/alarm/new`)}
        >
          새 알람 추가
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
