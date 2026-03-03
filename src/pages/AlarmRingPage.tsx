import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMission } from '../missions/useMission';
import MissionRenderer from '../components/missions/MissionRenderer';
import GroupMissionStatus from '../components/missions/GroupMissionStatus';
import { groupApi, missionApi, penaltyApi } from '../services/api';
import { AlarmWebSocket } from '../services/websocket';
import type { Group, MemberMissionStatus, PenaltyVoiceMessage, ServerMission } from '../types';
import './AlarmRingPage.css';

const TIMEOUT_SECONDS = 300; // 5분

type Phase = 'mission' | 'waiting' | 'done' | 'timeout';

export default function AlarmRingPage() {
  const { alarmId: alarmIdStr } = useParams<{ alarmId: string }>();
  const alarmId = parseInt(alarmIdStr || '0', 10);
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [serverMission, setServerMission] = useState<ServerMission | null>(null);

  // 내 미션을 로컬 interface Mission에 맞게 변환
  const localMission = useMemo(() => {
    if (!serverMission) return null;

    let answer: number | undefined = undefined;
    if (serverMission.type === 'MATH') {
      try {
        // "10 + 20" -> 30, "10 - 5" -> 5, "10 * 5" -> 50, "10 x 5" -> 50
        const normalizedPayload = serverMission.payload.replace(/[×x]/g, '*');
        const parts = normalizedPayload.split(' ');
        if (parts.length === 3) {
          const a = parseInt(parts[0], 10);
          const op = parts[1];
          const b = parseInt(parts[2], 10);
          if (op === '+') answer = a + b;
          else if (op === '-') answer = a - b;
          else if (op === '*' || op === '×') answer = a * b;
        }
      } catch (e) {
        console.error('Math parse error:', e);
      }
    }

    return {
      type: serverMission.type,
      label: serverMission.label,
      description: serverMission.description,
      targetValue: serverMission.targetValue,
      payload: serverMission.payload,
      answer: answer,
      patternSequence: serverMission.patternSequence,
    };
  }, [serverMission]);

  // useMission 훅은 serverMission이 로드된 후에만 의미 있는 상태를 가짐
  // 미션이 없으면 기본 TAP 미션으로 placeholder 처리 (hooks 규정상 조건부 호출 불가)
  const defaultMission = {
    type: 'TAP' as const,
    label: '미션 준비 중',
    description: '미션 데이터를 불러오고 있습니다.',
    targetValue: 1,
  };

  const [missionState, missionActions] = useMission(localMission || defaultMission);

  const [phase, setPhase] = useState<Phase>('mission');
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);

  // 벌칙 관련 상태
  const [penaltyPhrase, setPenaltyPhrase] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [receivedVoices, setReceivedVoices] = useState<PenaltyVoiceMessage[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // WebSocket 및 데이터 로딩
  const wsRef = useRef<AlarmWebSocket | null>(null);
  const [memberStatuses, setMemberStatuses] = useState<MemberMissionStatus[]>([]);

  // 초기 데이터 로딩
  useEffect(() => {
    if (!alarmId) return;

    const loadData = async () => {
      try {
        // 알람 정보 먼저 가져오기 (원래는 알람 ID로 그룹 ID를 알아야 하지만, 명세상 /api/groups/{id}는 그룹 ID 필요)
        // 여기서는 alarmId로 미션을 먼저 가져오고, 그룹 정보는 임시로 처리하거나 백엔드 구조에 따라 조정
        const mission = await missionApi.get(alarmId);
        setServerMission(mission);

        // 알람 상세 정보 fetch (가정: 알람 정보에 groupId가 포함되어 있거나, 다른 방식으로 그룹 식별)
        // 현재 Alarm 타입에는 groupId가 없으므로, 그룹 정보를 가져오는 로직은 프로젝트 구조에 따라 다를 수 있음
        // 여기선 groupId가 1이라고 가정하거나, 다른 API가 필요함.
        // 일단 그룹 목록에서 이 알람이 속한 그룹을 찾거나 하는 로직이 필요할 수 있음.
        const groups = await groupApi.getAll();
        // 실제로는 알람 상세 API가 groupId를 주거나 해야 함. 
        // 일단 첫 번째 그룹을 사용하거나 목업 처리 (실제 연동 시 수정 필요)
        if (groups.length > 0) {
          setGroup(groups[0]);
        }
      } catch (err) {
        console.error('데이터 로딩 실패:', err);
      }
    };

    loadData();
  }, [alarmId]);

  // WebSocket 연결 및 구독
  useEffect(() => {
    if (!group) return;

    const ws = new AlarmWebSocket(group.id);
    wsRef.current = ws;
    ws.connect();

    // 음성 업로드 알림 수신
    const unsubVoice = ws.on('penalty-voice', (data) => {
      setReceivedVoices((prev) => [...prev, data]);
      
      // 자동 재생 로직 추가
      const audio = new Audio(data.voiceUrl.startsWith('http') ? data.voiceUrl : `http://localhost:8080${data.voiceUrl}`);
      audio.play().catch(e => console.warn('음성 자동 재생 실패:', e));
    });

    // 벌칙 시작 알림 수신 (필요 시)
    const unsubStart = ws.on('penalty-start', (data) => {
      console.log('벌칙 시작 알림:', data);
    });

    return () => {
      unsubVoice();
      unsubStart();
      ws.disconnect();
    };
  }, [group]);

  // 주기적으로 멤버 미션 상태 확인
  useEffect(() => {
    if (!alarmId || phase === 'done') return;

    const fetchStatus = async () => {
      try {
        const statuses = await missionApi.getStatus(alarmId);
        setMemberStatuses(statuses);
        
        if (statuses.length > 0 && statuses.every(s => s.completed)) {
          setPhase('done');
        }
      } catch (err) {
        console.error('상태 확인 실패:', err);
      }
    };

    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [alarmId, phase]);

  // 내 미션 완료 시 서버에 보고
  useEffect(() => {
    if (missionState.isComplete && phase === 'mission') {
      missionApi.complete(alarmId)
        .then(() => setPhase('waiting'))
        .catch(err => console.error('미션 완료 보고 실패:', err));
    }
  }, [missionState.isComplete, phase, alarmId]);

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

  // 타임아웃 처리 → 벌칙 문구 가져오기
  useEffect(() => {
    if (timeLeft === 0 && phase !== 'done') {
      setPhase('timeout');
      if (alarmId) {
        penaltyApi.getPhrase(alarmId)
          .then((res) => setPenaltyPhrase(res.phrase))
          .catch(() => setPenaltyPhrase('일어나세요! 벌칙이에요! 🔔'));
      }
    }
  }, [timeLeft, phase, alarmId]);

  // Beep sound (알람 소리)
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

  // ─── 음성 녹음 관련 ───

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('마이크 접근 실패:', err);
      alert('마이크 권한이 필요합니다.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const uploadVoice = useCallback(async () => {
    if (!recordedBlob || !alarmId) return;
    setIsUploading(true);
    try {
      const file = new File([recordedBlob], 'penalty-voice.webm', { type: 'audio/webm' });
      await penaltyApi.uploadVoice(alarmId, file);
      setUploadComplete(true);
    } catch (err) {
      console.error('음성 업로드 실패:', err);
      alert('음성 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [recordedBlob, alarmId]);

  if (!alarmId) {
    return (
      <div className="alarm-ring alarm-ring--not-found">
        <p>알람 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const timeoutTargets = memberStatuses.filter((m) => !m.completed);

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
              🔔 알람 울림
            </motion.div>

            <div className="alarm-ring__group-label">
              그룹 <strong>{group?.name || '...'}</strong>에서 깨우는 중!
            </div>

            {localMission ? (
              <MissionRenderer
                mission={localMission}
                state={missionState}
                actions={missionActions}
              />
            ) : (
              <div className="alarm-ring__loading-mission">미션을 불러오는 중...</div>
            )}

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

        {/* Phase 4: 타임아웃 — 벌칙 (WebSocket + 음성) */}
        {phase === 'timeout' && (
          <motion.div
            className="timeout-penalty"
            key="timeout"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="timeout-penalty__icon">⏰</div>
            <h2 className="timeout-penalty__title">5분이 지났어요!</h2>

            {/* 미션 미수행자 목록 */}
            {timeoutTargets.length > 0 && (
              <div className="timeout-penalty__targets">
                <p className="timeout-penalty__targets-label">아직 일어나지 않은 멤버</p>
                {timeoutTargets.map((t) => (
                  <motion.div
                    key={t.userId}
                    className="timeout-penalty__target-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="timeout-penalty__target-name">💤 {t.name}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 벌칙 문구 */}
            <motion.div
              className="timeout-penalty__phrase-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="timeout-penalty__phrase-label">📢 벌칙 문구</span>
              <p className="timeout-penalty__phrase-text">
                {penaltyPhrase || '벌칙 문구를 불러오는 중...'}
              </p>
            </motion.div>

            {/* 음성 녹음 영역 */}
            <motion.div
              className="timeout-penalty__voice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <span className="timeout-penalty__voice-label">🎙️ 벌칙 문구를 읽어주세요</span>

              {!uploadComplete ? (
                <div className="timeout-penalty__voice-controls">
                  {!isRecording && !recordedBlob && (
                    <motion.button
                      className="timeout-penalty__record-btn"
                      onClick={startRecording}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="timeout-penalty__record-dot" />
                      녹음 시작
                    </motion.button>
                  )}

                  {isRecording && (
                    <motion.button
                      className="timeout-penalty__record-btn timeout-penalty__record-btn--recording"
                      onClick={stopRecording}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0.4)', '0 0 0 16px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0.4)'] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ⏹ 녹음 중지
                    </motion.button>
                  )}

                  {recordedBlob && !isRecording && (
                    <div className="timeout-penalty__voice-actions">
                      <motion.button
                        className="timeout-penalty__play-btn"
                        onClick={() => {
                          const url = URL.createObjectURL(recordedBlob);
                          new Audio(url).play();
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ▶ 미리듣기
                      </motion.button>
                      <motion.button
                        className="timeout-penalty__upload-btn"
                        onClick={uploadVoice}
                        disabled={isUploading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isUploading ? '업로드 중...' : '📤 업로드'}
                      </motion.button>
                      <motion.button
                        className="timeout-penalty__retry-btn"
                        onClick={() => setRecordedBlob(null)}
                        whileTap={{ scale: 0.95 }}
                      >
                        🔄 다시 녹음
                      </motion.button>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  className="timeout-penalty__upload-done"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                >
                  ✅ 음성이 업로드되었어요!
                </motion.div>
              )}
            </motion.div>

            {/* 수신된 다른 멤버 음성 */}
            {receivedVoices.length > 0 && (
              <motion.div
                className="timeout-penalty__received"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="timeout-penalty__received-label">🔊 다른 멤버의 벌칙 음성</span>
                {receivedVoices.map((v, i) => (
                  <motion.div
                    key={i}
                    className="timeout-penalty__received-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <span>{v.userName}</span>
                    <button
                      className="timeout-penalty__play-voice"
                      onClick={() => {
                        const url = v.voiceUrl.startsWith('http') ? v.voiceUrl : `http://localhost:8080${v.voiceUrl}`;
                        new Audio(url).play();
                      }}
                    >
                      ▶ 재생
                    </button>
                  </motion.div>
                ))}
              </motion.div>
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
