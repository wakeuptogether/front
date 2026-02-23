import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { alarms, groups, formatTime } from '../data/mockData';
import { generateRandomMission } from '../missions/missionEngine';
import { useMission } from '../missions/useMission';
import MissionRenderer from '../components/missions/MissionRenderer';
import GroupMissionStatus from '../components/missions/GroupMissionStatus';
import type { MemberMissionStatus } from '../types';
import './AlarmRingPage.css';

const TIMEOUT_SECONDS = 300; // 5분

type Phase = 'mission' | 'waiting' | 'done' | 'timeout';

export default function AlarmRingPage() {
  const { alarmId } = useParams<{ alarmId: string }>();
  const navigate = useNavigate();
  const alarm = alarms.find((a) => a.id === alarmId);
  const group = alarm ? groups.find((g) => g.id === alarm.groupId) : null;

  // 내 미션 (랜덤 생성, 마운트 시 1번만)
  const myMission = useMemo(() => generateRandomMission(), []);
  const [missionState, missionActions] = useMission(myMission);

  const [phase, setPhase] = useState<Phase>('mission');
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);

  // 그룹 멤버 미션 상태 (시뮬레이션)
  const [memberStatuses, setMemberStatuses] = useState<MemberMissionStatus[]>(() => {
    if (!group) return [];
    return group.members.map((member) => ({
      userId: member.id,
      userName: member.name,
      mission: generateRandomMission(),
      progress: 0,
      completed: member.id === 'u1', // 나(u1)는 시작 시 미완료, 아래 effect에서 업데이트
    }));
  });

  // 내 미션 완료 시 → waiting 단계로
  useEffect(() => {
    if (missionState.isComplete && phase === 'mission') {
      setPhase('waiting');
      // 내 상태 업데이트
      setMemberStatuses((prev) =>
        prev.map((m) =>
          m.userId === 'u1'
            ? { ...m, completed: true, completedAt: new Date().toISOString(), progress: myMission.targetValue }
            : m
        )
      );
    }
  }, [missionState.isComplete, phase, myMission.targetValue]);

  // 카운트다운 타이머
  useEffect(() => {
    if (phase === 'done' || phase === 'timeout') return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // 타임아웃 처리
  useEffect(() => {
    if (timeLeft === 0 && phase !== 'done') {
      setPhase('timeout');
    }
  }, [timeLeft, phase]);

  // 시뮬레이션: 다른 멤버들이 점점 완료하는 효과
  useEffect(() => {
    if (phase !== 'waiting') return;

    const otherMembers = group?.members.filter((m) => m.id !== 'u1') ?? [];
    let completedCount = 0;

    const completeNext = () => {
      if (completedCount >= otherMembers.length) return;
      const member = otherMembers[completedCount];
      completedCount++;

      setMemberStatuses((prev) => {
        const updated = prev.map((m) =>
          m.userId === member.id
            ? { ...m, completed: true, completedAt: new Date().toISOString(), progress: m.mission.targetValue }
            : m
        );

        // 전원 완료 체크
        if (updated.every((m) => m.completed)) {
          setTimeout(() => setPhase('done'), 600);
        }
        return updated;
      });
    };

    // 랜덤 간격으로 완료 시뮬레이션 (3~8초)
    const timers: ReturnType<typeof setTimeout>[] = [];
    otherMembers.forEach((_, i) => {
      const delay = (i + 1) * (3000 + Math.random() * 5000);
      timers.push(setTimeout(completeNext, delay));
    });

    return () => timers.forEach(clearTimeout);
  }, [phase, group]);

  // 시뮬레이션: 진행 중 멤버 progress 업데이트
  useEffect(() => {
    if (phase !== 'waiting') return;

    const interval = setInterval(() => {
      setMemberStatuses((prev) =>
        prev.map((m) => {
          if (m.completed || m.userId === 'u1') return m;
          const increment = Math.floor(Math.random() * 5) + 1;
          return { ...m, progress: Math.min(m.progress + increment, m.mission.targetValue - 1) };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [phase]);

  // Beep sound
  useEffect(() => {
    if (phase === 'done' || phase === 'timeout') return;

    let audioCtx: AudioContext | null = null;
    const playBeep = () => {
      try {
        if (!audioCtx) audioCtx = new AudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.value = 0.15;
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch {
        // Audio not available
      }
    };

    playBeep();
    const interval = setInterval(playBeep, 2000);

    return () => {
      clearInterval(interval);
      audioCtx?.close();
    };
  }, [phase]);

  if (!alarm || !group) {
    return (
      <div className="alarm-ring alarm-ring--not-found">
        <p>알람을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 타임아웃 시 메시지 보낼 대상: 진행도 0%인 사람만 (미션 수행 시도한 사람 제외)
  const timeoutTargets = memberStatuses.filter(
    (m) => !m.completed && m.progress === 0
  );

  return (
    <div className="alarm-ring">
      {/* Pulse rings */}
      {phase !== 'done' && (
        <div className="alarm-ring__pulses">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="alarm-ring__pulse"
              animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Phase 1: 미션 수행 */}
        {phase === 'mission' && (
          <motion.div
            className="alarm-ring__content"
            key="mission"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="alarm-ring__time"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {formatTime(alarm.hour, alarm.minute)}
            </motion.div>

            <div className="alarm-ring__group-label">
              그룹 <strong>{group.name}</strong>에서 깨우는 중!
            </div>

            <MissionRenderer
              mission={myMission}
              state={missionState}
              actions={missionActions}
            />

            {/* 하단 타이머 미니 표시 */}
            <div className="alarm-ring__mini-timer">
              ⏰ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
          </motion.div>
        )}

        {/* Phase 2: 대기 (그룹 멤버 완료 대기) */}
        {phase === 'waiting' && (
          <motion.div
            className="alarm-ring__content"
            key="waiting"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="alarm-ring__waiting-header">
              <motion.div
                className="alarm-ring__waiting-icon"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✅
              </motion.div>
              <h2 className="alarm-ring__waiting-title">미션 완료!</h2>
              <p className="alarm-ring__waiting-sub">
                다른 멤버들을 기다리는 중...
              </p>
            </div>

            <GroupMissionStatus
              members={memberStatuses}
              timeoutSeconds={timeLeft}
              maxSeconds={TIMEOUT_SECONDS}
            />
          </motion.div>
        )}

        {/* Phase 3: 전원 완료 */}
        {phase === 'done' && (
          <motion.div
            className="alarm-ring__done"
            key="done"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
          >
            <motion.div
              className="alarm-ring__done-icon"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              🎉
            </motion.div>
            <span>모두 함께 일어났어요!</span>
            <motion.button
              className="alarm-ring__done-btn"
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              확인
            </motion.button>
          </motion.div>
        )}

        {/* Phase 4: 타임아웃 */}
        {phase === 'timeout' && (
          <motion.div
            className="timeout-message"
            key="timeout"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="timeout-message__icon">⏰</div>
            <h2 className="timeout-message__title">5분이 지났어요!</h2>

            {timeoutTargets.length > 0 ? (
              <>
                <p className="timeout-message__detail">
                  미션에 손도 대지 않은 사람에게 메시지가 전송되었어요
                </p>
                <div className="timeout-message__sent-list">
                  {timeoutTargets.map((t) => (
                    <motion.div
                      key={t.userId}
                      className="timeout-message__sent-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="timeout-message__sent-name">{t.userName}</span>
                      <span className="timeout-message__sent-badge">
                        📩 "{t.userName}이 자고있어요~" 전송됨
                      </span>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <p className="timeout-message__no-send">
                모두 미션을 시도했으므로 메시지는 전송되지 않았어요
              </p>
            )}

            <motion.button
              className="alarm-ring__done-btn"
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              확인
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
