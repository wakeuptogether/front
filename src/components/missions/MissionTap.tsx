import { motion } from 'framer-motion';
import type { Mission } from '../../types';
import type { MissionState, MissionActions } from '../../missions/useMission';
import './missions.css';

interface Props {
  mission: Mission;
  state: MissionState;
  actions: MissionActions;
}

export default function MissionTap({ mission, state, actions }: Props) {
  const percent = Math.min((state.progress / mission.targetValue) * 100, 100);

  return (
    <div className="mission mission--tap">
      <div className="mission__icon">👆</div>
      <h2 className="mission__label">{mission.label}</h2>
      <p className="mission__desc">{mission.description}</p>

      <motion.button
        className="mission__tap-area"
        onClick={actions.handleTap}
        whileTap={{ scale: 0.95 }}
        disabled={state.isComplete}
      >
        <svg viewBox="0 0 200 200" className="mission__tap-svg">
          <circle cx="100" cy="100" r="90" className="mission__ring-bg" />
          <motion.circle
            cx="100" cy="100" r="90"
            className="mission__ring-fill"
            strokeDasharray={2 * Math.PI * 90}
            initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - percent / 100) }}
            transition={{ duration: 0.15 }}
          />
        </svg>
        <div className="mission__tap-count">
          <span className="mission__tap-number">{state.progress}</span>
          <span className="mission__tap-total">/ {mission.targetValue}</span>
        </div>
      </motion.button>

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
