import { motion } from 'framer-motion';
import type { Mission } from '../../types';
import type { MissionState, MissionActions } from '../../missions/useMission';
import './missions.css';

interface Props {
  mission: Mission;
  state: MissionState;
  actions: MissionActions;
}

export default function MissionShake({ mission, state, actions }: Props) {
  const percent = Math.min((state.progress / mission.targetValue) * 100, 100);

  return (
    <div className="mission mission--shake">
      <div className="mission__icon">📱</div>
      <h2 className="mission__label">{mission.label}</h2>
      <p className="mission__desc">{mission.description}</p>

      <div className="mission__progress-ring">
        <svg viewBox="0 0 120 120" className="mission__svg">
          <circle cx="60" cy="60" r="52" className="mission__ring-bg" />
          <motion.circle
            cx="60" cy="60" r="52"
            className="mission__ring-fill"
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={2 * Math.PI * 52 * (1 - percent / 100)}
            initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - percent / 100) }}
            transition={{ duration: 0.2 }}
          />
        </svg>
        <div className="mission__progress-text">
          <span className="mission__progress-count">{state.progress}</span>
          <span className="mission__progress-total">/ {mission.targetValue}</span>
        </div>
      </div>

      {/* Desktop fallback button */}
      <motion.button
        className="mission__shake-btn"
        onClick={actions.handleShake}
        whileTap={{ scale: 0.9, rotate: [0, -10, 10, -10, 0] }}
        disabled={state.isComplete}
      >
        {state.isComplete ? '✅ 완료!' : '📱 흔들기 (클릭)'}
      </motion.button>
      <p className="mission__hint">모바일에서는 폰을 흔들어주세요!</p>
    </div>
  );
}
