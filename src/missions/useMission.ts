import { useState, useEffect, useCallback, useRef } from 'react';
import type { Mission } from '../types';

export interface MissionState {
  progress: number;
  isComplete: boolean;
  inputValue: string;
  isWrong: boolean;
  patternStep: number;
  patternShowPhase: boolean;
}

export interface MissionActions {
  handleTap: () => void;
  handleShake: () => void;
  handleInput: (text: string) => void;
  handleSubmitAnswer: (answer: string) => void;
  handlePatternTap: (index: number) => void;
}

export function useMission(mission: Mission): [MissionState, MissionActions] {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isWrong, setIsWrong] = useState(false);
  const [patternStep, setPatternStep] = useState(0);
  const [patternShowPhase, setPatternShowPhase] = useState(mission.type === 'PATTERN');
  const shakeRef = useRef<{ lastX: number; lastY: number; lastZ: number; count: number }>({
    lastX: 0, lastY: 0, lastZ: 0, count: 0
  });

  // SHAKE 미션: DeviceMotion 사용
  useEffect(() => {
    if (mission.type !== 'SHAKE' || isComplete) return;

    const threshold = 15;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const { lastX, lastY, lastZ } = shakeRef.current;
      const deltaX = Math.abs(acc.x - lastX);
      const deltaY = Math.abs(acc.y - lastY);
      const deltaZ = Math.abs(acc.z - lastZ);

      if (deltaX + deltaY + deltaZ > threshold) {
        shakeRef.current.count += 1;
        const newProgress = shakeRef.current.count;
        setProgress(newProgress);
        if (newProgress >= mission.targetValue) {
          setIsComplete(true);
        }
      }

      shakeRef.current.lastX = acc.x;
      shakeRef.current.lastY = acc.y;
      shakeRef.current.lastZ = acc.z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [mission, isComplete]);

  // PATTERN 미션: 표시 단계 타이머
  useEffect(() => {
    if (mission.type !== 'PATTERN' || !patternShowPhase) return;
    const timer = setTimeout(() => {
      setPatternShowPhase(false);
    }, (mission.patternSequence?.length ?? 5) * 600 + 1000);
    return () => clearTimeout(timer);
  }, [mission, patternShowPhase]);

  const handleTap = useCallback(() => {
    if (isComplete || mission.type !== 'TAP') return;
    setProgress((p) => {
      const next = p + 1;
      if (next >= mission.targetValue) setIsComplete(true);
      return next;
    });
  }, [isComplete, mission]);

  const handleShake = useCallback(() => {
    // Desktop fallback: 시뮬레이션 버튼용
    if (isComplete || mission.type !== 'SHAKE') return;
    setProgress((p) => {
      const next = p + 1;
      if (next >= mission.targetValue) setIsComplete(true);
      return next;
    });
  }, [isComplete, mission]);

  const handleInput = useCallback((text: string) => {
    if (isComplete || mission.type !== 'TYPE_GIBBERISH') return;
    setInputValue(text);
    setIsWrong(false);
    if (text === mission.payload) {
      setProgress(1);
      setIsComplete(true);
    }
  }, [isComplete, mission]);

  const handleSubmitAnswer = useCallback((answer: string) => {
    if (isComplete || mission.type !== 'MATH') return;
    const num = parseInt(answer, 10);
    if (num === mission.answer) {
      setProgress(1);
      setIsComplete(true);
      setIsWrong(false);
    } else {
      setIsWrong(true);
    }
  }, [isComplete, mission]);

  const handlePatternTap = useCallback((index: number) => {
    if (isComplete || mission.type !== 'PATTERN' || patternShowPhase) return;
    const seq = mission.patternSequence;
    if (!seq) return;

    if (seq[patternStep] === index) {
      const nextStep = patternStep + 1;
      setPatternStep(nextStep);
      setProgress(nextStep);
      setIsWrong(false);
      if (nextStep >= seq.length) {
        setIsComplete(true);
      }
    } else {
      // 틀리면 처음부터
      setPatternStep(0);
      setProgress(0);
      setIsWrong(true);
      setPatternShowPhase(true);
    }
  }, [isComplete, mission, patternStep, patternShowPhase]);

  return [
    { progress, isComplete, inputValue, isWrong, patternStep, patternShowPhase },
    { handleTap, handleShake, handleInput, handleSubmitAnswer, handlePatternTap }
  ];
}
