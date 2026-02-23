import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Mission } from '../../types';
import type { MissionState, MissionActions } from '../../missions/useMission';
import './missions.css';

interface Props {
  mission: Mission;
  state: MissionState;
  actions: MissionActions;
}

export default function MissionMath({ mission, state, actions }: Props) {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.handleSubmitAnswer(inputVal);
    if (!state.isComplete) setInputVal('');
  };

  return (
    <div className="mission mission--math">
      <div className="mission__icon">🧮</div>
      <h2 className="mission__label">{mission.label}</h2>
      <p className="mission__desc">{mission.description}</p>

      <div className="mission__math-problem">
        <span className="mission__math-expression">{mission.payload}</span>
        <span className="mission__math-eq">=</span>
        <span className="mission__math-q">?</span>
      </div>

      <form onSubmit={handleSubmit} className="mission__math-form">
        <input
          className={`mission__math-input ${state.isWrong ? 'mission__math-input--wrong' : ''}`}
          type="number"
          inputMode="numeric"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="정답 입력"
          autoFocus
          disabled={state.isComplete}
        />
        <motion.button
          type="submit"
          className="mission__math-submit"
          whileTap={{ scale: 0.92 }}
          disabled={state.isComplete || !inputVal}
        >
          확인
        </motion.button>
      </form>

      {state.isWrong && (
        <motion.p
          className="mission__wrong-msg"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ❌ 틀렸어요! 다시 시도하세요
        </motion.p>
      )}

      {state.isComplete && (
        <motion.div
          className="mission__complete-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          ✅ 정답!
        </motion.div>
      )}
    </div>
  );
}
