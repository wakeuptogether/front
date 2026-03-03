import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Link2, Plus, Check, Repeat } from 'lucide-react';
import { useState, useEffect } from 'react';
import Card from '../components/Card';
import CircularProgress from '../components/CircularProgress';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import { groupApi, alarmApi, missionApi } from '../services/api';
import type { Group, Alarm, MemberMissionStatus } from '../types';
import './GroupDetailPage.css';

import { REVERSE_DAY_MAP, type ServerDayOfWeek } from '../types';

// JWT 토큰에서 userId 파싱
function getUserIdFromToken(): number {
  const token = localStorage.getItem('token');
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return parseInt(payload.sub || '0', 10);
  } catch {
    return 0;
  }
}

function getRepeatLabel(daysStr: string): string {
  if (!daysStr) return '없음';
  const days = daysStr.split(',').map(d => d.trim() as ServerDayOfWeek).filter(Boolean);
  if (days.length === 7) return '매일';
  const weekdays: ServerDayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  if (days.length === 5 && weekdays.every((d) => days.includes(d))) return '평일';
  return days.map(d => REVERSE_DAY_MAP[d] || d).join(', ');
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
  const { id: groupIdStr } = useParams<{ id: string }>();
  const groupId = parseInt(groupIdStr || '0', 10);
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [alarmStatuses, setAlarmStatuses] = useState<Record<number, MemberMissionStatus[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUserId = getUserIdFromToken();
  const isCreator = group?.createdByUserId === currentUserId;

  useEffect(() => {
    if (!groupId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [groupData, rawAlarmsData] = await Promise.all([
          groupApi.getById(groupId),
          alarmApi.getByGroup(groupId)
        ]);

        const alarmsData = (rawAlarmsData || []).map((a: Alarm) => ({
          ...a,
          id: a.id || a.alarmId || 0
        }));

        setGroup(groupData);
        setAlarms(alarmsData);

        const fetchStatuses = async () => {
          const statusMap: Record<number, MemberMissionStatus[]> = {};
          await Promise.all(
            alarmsData.map(async (alarm: Alarm) => {
              if (!alarm.id) return;
              try {
                const status = await missionApi.getStatus(alarm.id);
                statusMap[alarm.id] = status;
              } catch {
                console.warn(`알람 ${alarm.id} 상태 로드 실패`);
              }
            })
          );
          setAlarmStatuses(statusMap);
        };
        fetchStatuses();
      } catch (err) {
        console.error('데이터 로딩 실패:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [groupId]);

  const handleCopyInvite = () => {
    if (group?.inviteCode) {
      navigator.clipboard?.writeText(group.inviteCode);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const handleToggleAlarm = async (alarmId: number) => {
    if (!isCreator) return;
    try {
      const alarm = alarms.find(a => a.id === alarmId);
      if (!alarm) return;
      await alarmApi.toggle(alarmId, !alarm.isActive);
      setAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, isActive: !a.isActive } : a));
    } catch (err) {
      console.error('알람 토글 실패:', err);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isCreator || !group) return;
    if (!window.confirm('정말로 이 그룹을 삭제하시겠습니까? 모든 알람과 데이터가 삭제됩니다.')) return;

    setIsDeleting(true);
    try {
      await groupApi.delete(group.id);
      navigate('/dashboard');
    } catch (err) {
      console.error('그룹 삭제 실패:', err);
      alert('그룹 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    const m = String(minute).padStart(2, '0');
    return `${period} ${h}:${m}`;
  };

  if (isLoading) {
    return <div className="group-detail__loading">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="group-detail group-detail--error">
        <p className="group-detail__error-message">{error}</p>
        <Button onClick={() => navigate('/dashboard')}>돌아가기</Button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-detail group-detail--not-found">
        <p>그룹을 찾을 수 없습니다.</p>
        <Button onClick={() => navigate('/dashboard')}>돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="group-detail">
      {/* Header */}
      <header className="group-detail__header">
        <button className="group-detail__back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={22} />
        </button>
        <div className="group-detail__header-info">
          <h1 className="group-detail__name">{group.name}</h1>
          <span className="group-detail__member-count">초대코드: {group.inviteCode}</span>
        </div>
        <button
          className={`group-detail__invite ${copiedInvite ? 'group-detail__invite--copied' : ''}`}
          onClick={handleCopyInvite}
        >
          {copiedInvite ? <Check size={16} /> : <Link2 size={16} />}
          {copiedInvite ? '복사됨!' : '초대'}
        </button>
      </header>

      {/* Alarms */}
      <motion.div
        className="group-detail__alarms"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <h2 className="group-detail__section-title">알람 목록</h2>
        {alarms.map((alarm, index) => {
          const alarmKey = alarm.id || `temp-${index}`;
          const statuses = alarmStatuses[alarm.id] || [];
          const completedCount = statuses.filter(s => s.completed).length;
          const totalCount = statuses.length || 1;

          return (
            <motion.div key={alarmKey} variants={item}>
              <Card
                className={`group-detail__alarm-card ${!alarm.isActive ? 'group-detail__alarm-card--inactive' : ''}`}
                onClick={() => {
                  if (isCreator) navigate(`/group/${groupId}/alarm/${alarm.id}`);
                }}
                hoverable={isCreator}
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
                    completed={completedCount}
                    total={totalCount}
                    size={44}
                    strokeWidth={3.5}
                  />
                  <div className="group-detail__toggle-container">
                    <input
                      type="checkbox"
                      checked={alarm.isActive}
                      disabled={!isCreator}
                      onChange={() => handleToggleAlarm(alarm.id)}
                      className="group-detail__toggle-input"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 방장만 보이는 버튼들 */}
      {isCreator && (
        <div className="group-detail__admin-actions">
          <div className="group-detail__add">
            <Button
              fullWidth
              icon={<Plus size={18} />}
              onClick={() => navigate(`/group/${group.id}/alarm/new`)}
            >
              새 알람 추가
            </Button>
          </div>
          <Button
            fullWidth
            variant="danger"
            onClick={handleDeleteGroup}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '그룹 삭제'}
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}