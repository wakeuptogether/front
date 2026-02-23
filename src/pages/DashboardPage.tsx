import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Clock, Users } from 'lucide-react';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import AvatarGroup from '../components/AvatarGroup';
import ThemeToggle from '../components/ThemeToggle';
import BottomNav from '../components/BottomNav';
import { groups, getGroupAlarms, formatTime, currentUser } from '../data/mockData';
import './DashboardPage.css';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const getNextAlarm = (groupId: string) => {
    const alarms = getGroupAlarms(groupId);
    if (alarms.length === 0) return null;
    const sorted = [...alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
    return sorted[0];
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard__header">
        <div className="dashboard__header-left">
          <h1 className="dashboard__title">내 그룹</h1>
          <p className="dashboard__subtitle">
            안녕하세요, {currentUser.name}님 👋
          </p>
        </div>
        <div className="dashboard__header-right">
          <ThemeToggle />
          <Avatar name={currentUser.name} size="md" />
        </div>
      </header>

      {/* Group Cards */}
      {groups.length > 0 ? (
        <motion.div
          className="dashboard__grid"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {groups.map((group) => {
            const nextAlarm = getNextAlarm(group.id);
            return (
              <motion.div key={group.id} variants={item}>
                <Card
                  hoverable
                  onClick={() => navigate(`/group/${group.id}`)}
                  className="dashboard__card"
                >
                  <div className="dashboard__card-header">
                    <h3 className="dashboard__card-name">{group.name}</h3>
                    <div className="dashboard__card-members">
                      <Users size={14} />
                      <span>{group.members.length}</span>
                    </div>
                  </div>

                  <AvatarGroup users={group.members} max={4} size="sm" />

                  {nextAlarm && (
                    <div className="dashboard__card-alarm">
                      <Clock size={16} />
                      <span className="dashboard__card-time">
                        {formatTime(nextAlarm.hour, nextAlarm.minute)}
                      </span>
                      <span className="dashboard__card-alarm-title">
                        {nextAlarm.title}
                      </span>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          className="dashboard__empty"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="dashboard__empty-icon">
            <Users size={48} />
          </div>
          <h2>아직 그룹이 없어요</h2>
          <p>그룹을 만들어 친구들과 함께 깨어나보세요!</p>
        </motion.div>
      )}

      {/* FAB */}
      <motion.button
        className="dashboard__fab"
        onClick={() => {}}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus size={24} />
        <span className="dashboard__fab-label">새 그룹</span>
      </motion.button>

      <BottomNav />
    </div>
  );
}
