import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Mission } from '../../types';
import type { MissionState, MissionActions } from '../../missions/useMission';
import './missions.css';

interface Props {
  mission: Mission;
  state: MissionState;
  actions: MissionActions;
}

export default function MissionPattern({ mission, state, actions }: Props) {
  const seq = useMemo(() => mission.patternSequence ?? [], [mission.patternSequence]);
  const [highlightIdx, setHighlightIdx] = useState(-1);

  // 패턴 표시 애니메이션
  useEffect(() => {
    if (!state.patternShowPhase) return;
    let step = 0;
    const timer = setInterval(() => {
      if (step < seq.length) {
        setHighlightIdx(seq[step]);
        step++;
      } else {
        setHighlightIdx(-1);
        clearInterval(timer);
      }
    }, 600);

    return () => {
      clearInterval(timer);
      setHighlightIdx(-1);
    };
  }, [state.patternShowPhase, seq]);

  const cells = Array.from({ length: 9 }, (_, i) => i);

  return (
    <div className="mission mission--pattern">
      <div className="mission__icon">🔲</div>
      <h2 className="mission__label">{mission.label}</h2>
      <p className="mission__desc">
        {state.patternShowPhase ? '패턴을 기억하세요!' : mission.description}
      </p>

      <div className="mission__pattern-progress">
        {state.progress} / {mission.targetValue}
      </div>

      <div className="mission__pattern-grid">
        {cells.map((i) => {
          const isHighlight = state.patternShowPhase && highlightIdx === i;
          const isNextTarget = !state.patternShowPhase && seq[state.patternStep] === i;
          const isDone = !state.patternShowPhase && seq.indexOf(i) !== -1 && seq.indexOf(i) < state.patternStep;

          return (
            <motion.button
              key={i}
              className={`mission__pattern-cell ${
                isHighlight ? 'mission__pattern-cell--highlight' : ''
              } ${isDone ? 'mission__pattern-cell--done' : ''} ${
                isNextTarget ? '' : ''
              }`}
              onClick={() => actions.handlePatternTap(i)}
              whileTap={{ scale: 0.88 }}
              animate={isHighlight ? { scale: [1, 1.15, 1], backgroundColor: 'rgba(90,158,255,0.8)' } : {}}
              transition={{ duration: 0.3 }}
              disabled={state.isComplete || state.patternShowPhase}
            />
          );
        })}
      </div>

      {state.isWrong && !state.patternShowPhase && (
        <motion.p
          className="mission__wrong-msg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ❌ 순서가 틀렸어요! 다시 보여드릴게요
        </motion.p>
      )}

      {state.isComplete && (
        <motion.div
          className="mission__complete-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          ✅ 완료!
        </motion.div>
      )}
    </div>
  );
}
