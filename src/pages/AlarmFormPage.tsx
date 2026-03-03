import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import TimePicker from '../components/TimePicker';
import Input from '../components/Input';
import Button from '../components/Button';
import { alarmApi } from '../services/api';
import type { DayOfWeek } from '../types';
import { toServerDays, fromServerDays } from '../types';
import './AlarmFormPage.css';

const allDays: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];

export default function AlarmFormPage() {
  const { id: groupIdStr, alarmId: alarmIdStr } = useParams<{ id: string; alarmId?: string }>();
  const groupId = parseInt(groupIdStr || '0', 10);
  const alarmId = alarmIdStr ? parseInt(alarmIdStr, 10) : null;
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [title, setTitle] = useState('');
  const [repeatDays, setRepeatDays] = useState<DayOfWeek[]>(['월', '화', '수', '목', '금']);

  useEffect(() => {
    if (alarmId && groupId) {
      // 특정 그룹의 알람 목록에서 해당 알람 찾기 (getById가 없으므로)
      alarmApi.getByGroup(groupId).then((alarms) => {
        const existing = alarms.find((a) => a.id === alarmId);
        if (existing) {
          setHour(existing.hour);
          setMinute(existing.minute);
          setTitle(existing.title);
          setRepeatDays(fromServerDays(existing.repeatDays));
        }
      });
    }
  }, [alarmId, groupId]);

  const toggleDay = (day: DayOfWeek) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    setIsLoading(true);

    try {
      const daysStr = toServerDays(repeatDays);
      if (alarmId) {
        await alarmApi.update(alarmId, { hour, minute, title, repeatDays: daysStr, isActive: true });
      } else {
        await alarmApi.create(groupId, { hour, minute, title, repeatDays: daysStr, isActive: true });
      }
      navigate(`/group/${groupId}`);
    } catch (err) {
      console.error('알람 저장 실패:', err);
      alert('알람 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="alarm-form">
      <motion.div
        className="alarm-form__content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <header className="alarm-form__header">
          <button className="alarm-form__back" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </button>
          <h1 className="alarm-form__title">
            {alarmId ? '알람 수정' : '새 알람'}
          </h1>
          <div style={{ width: 40 }} />
        </header>

        <form onSubmit={handleSave} className="alarm-form__body">
          {/* Time Picker */}
          <div className="alarm-form__time-section">
            <TimePicker
              hour={hour}
              minute={minute}
              onChange={(h, m) => {
                setHour(h);
                setMinute(m);
              }}
            />
          </div>

          {/* Title */}
          <Input
            id="alarm-title"
            label="알람 제목"
            placeholder="예: 아침 조깅 시작!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Repeat Days */}
          <div className="alarm-form__days">
            <label className="alarm-form__days-label">반복 요일</label>
            <div className="alarm-form__days-grid">
              {allDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`alarm-form__day ${
                    repeatDays.includes(day) ? 'alarm-form__day--active' : ''
                  }`}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Mission Info */}
          <div className="alarm-form__mission">
            <label className="alarm-form__mission-label">
              미션
            </label>
            <div className="alarm-form__mission-info">
              🎲 알람이 울릴 때 랜덤 미션이 자동으로 부여됩니다
              <span className="alarm-form__mission-examples">
                흔들기 30번 · 터치 100번 · 글자 따라쓰기 · 수학 문제 · 패턴 터치
              </span>
            </div>
          </div>

          {/* Save & Delete */}
          <div className="alarm-form__actions">
            {alarmId && (
              <Button
                type="button"
                variant="danger"
                fullWidth
                size="lg"
                icon={<Trash2 size={20} />}
                disabled={isLoading}
                onClick={async () => {
                  if (window.confirm('정말로 이 알람을 삭제하시겠습니까?')) {
                    setIsLoading(true);
                    try {
                      await alarmApi.delete(alarmId);
                      navigate(`/group/${groupId}`);
                    } catch (err) {
                      console.error('알람 삭제 실패:', err);
                      alert('알람 삭제에 실패했습니다.');
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
              >
                삭제하기
              </Button>
            )}
            <Button type="submit" fullWidth size="lg" icon={<Save size={20} />} disabled={isLoading}>
              {isLoading ? '저장 중...' : '저장하기'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
