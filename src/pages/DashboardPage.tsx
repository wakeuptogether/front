import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Users, UserPlus } from 'lucide-react';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import ThemeToggle from '../components/ThemeToggle';
import BottomNav from '../components/BottomNav';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { groupApi, alarmApi } from '../services/api';
import type { Group, Alarm } from '../types';
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupAlarms, setGroupAlarms] = useState<Record<number, Alarm[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const userName = localStorage.getItem('userName') || '사용자';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedGroups = await groupApi.getAll();
      setGroups(fetchedGroups);

      const alarmsMap: Record<number, Alarm[]> = {};
      for (const group of fetchedGroups) {
        try {
          const alarms = await alarmApi.getByGroup(group.id);
          alarmsMap[group.id] = alarms;
        } catch (e) {
          console.error(`Failed to load alarms for group ${group.id}:`, e);
          alarmsMap[group.id] = [];
        }
      }
      setGroupAlarms(alarmsMap);
    } catch (err) {
      console.error('데이터 로딩 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      await groupApi.create(newGroupName);
      setIsCreateOpen(false);
      setNewGroupName('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '그룹 생성 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      await groupApi.join(inviteCode);
      setIsJoinOpen(false);
      setInviteCode('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '그룹 참여 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const getNextAlarm = (groupId: number) => {
    const alarms = groupAlarms[groupId] || [];
    if (alarms.length === 0) return null;
    const sorted = [...alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
    return sorted[0];
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    const m = String(minute).padStart(2, '0');
    return `${period} ${h}:${m}`;
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__header-left">
          <h1 className="dashboard__title">내 그룹</h1>
          <p className="dashboard__subtitle">
            안녕하세요, {userName}님 👋
          </p>
        </div>
        <div className="dashboard__header-right">
          <ThemeToggle />
          <Avatar name={userName} size="md" />
        </div>
      </header>

      {isLoading ? (
        <div className="dashboard__loading">로딩 중...</div>
      ) : groups.length > 0 ? (
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
                    <div className="dashboard__card-invite">
                      <span>코드: {group.inviteCode}</span>
                    </div>
                  </div>

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

      {/* FAB with Options */}
      <div className="dashboard__fab-container">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div 
              className="dashboard__fab-options"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
            >
              <button 
                className="dashboard__fab-option"
                onClick={() => {
                  setIsCreateOpen(true);
                  setIsFabOpen(false);
                }}
              >
                <Plus size={18} />
                <span>그룹 생성</span>
              </button>
              <button 
                className="dashboard__fab-option"
                onClick={() => {
                  setIsJoinOpen(true);
                  setIsFabOpen(false);
                }}
              >
                <UserPlus size={18} />
                <span>초대로 참가</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          className={`dashboard__fab ${isFabOpen ? 'dashboard__fab--active' : ''}`}
          onClick={() => setIsFabOpen(!isFabOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={24} style={{ transform: isFabOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s' }} />
        </motion.button>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        title="새 그룹 만들기"
      >
        <form onSubmit={handleCreateGroup}>
          <Input
            id="groupName"
            label="그룹 이름"
            placeholder="우리 가족, 런닝 크루 등"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            disabled={actionLoading}
            autoFocus
          />
          {error && <p className="dashboard__modal-error">{error}</p>}
          <div className="dashboard__modal-actions">
            <Button 
              type="submit" 
              fullWidth 
              disabled={!newGroupName.trim() || actionLoading}
            >
              {actionLoading ? '생성 중...' : '만들기'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isJoinOpen} 
        onClose={() => setIsJoinOpen(false)} 
        title="초대로 참가하기"
      >
        <form onSubmit={handleJoinGroup}>
          <Input
            id="inviteCode"
            label="초대 코드"
            placeholder="abc12345 형식"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            disabled={actionLoading}
            autoFocus
          />
          {error && <p className="dashboard__modal-error">{error}</p>}
          <div className="dashboard__modal-actions">
            <Button 
              type="submit" 
              fullWidth 
              disabled={!inviteCode.trim() || actionLoading}
            >
              {actionLoading ? '참가 중...' : '참가하기'}
            </Button>
          </div>
        </form>
      </Modal>

      <BottomNav />
    </div>
  );
}
