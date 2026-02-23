import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import TimePicker from '../components/TimePicker';
import Input from '../components/Input';
import Button from '../components/Button';
import { alarms } from '../data/mockData';
import type { DayOfWeek } from '../types';
import './AlarmFormPage.css';

const allDays: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];

export default function AlarmFormPage() {
  const { id: groupId, alarmId } = useParams<{ id: string; alarmId?: string }>();
  const navigate = useNavigate();
  const existing = alarmId ? alarms.find((a) => a.id === alarmId) : null;

  const [hour, setHour] = useState(existing?.hour ?? 7);
  const [minute, setMinute] = useState(existing?.minute ?? 0);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [repeatDays, setRepeatDays] = useState<DayOfWeek[]>(
    existing?.repeatDays ?? ['월', '화', '수', '목', '금']
  );

  const toggleDay = (day: DayOfWeek) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock save — just navigate back
    navigate(`/group/${groupId}`);
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
            {existing ? '알람 수정' : '새 알람'}
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

          {/* Save */}
          <Button type="submit" fullWidth size="lg" icon={<Save size={20} />}>
            저장하기
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
