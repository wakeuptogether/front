import { motion } from 'framer-motion';
import type { Mission } from '../../types';
import type { MissionState, MissionActions } from '../../missions/useMission';
import './missions.css';

interface Props {
  mission: Mission;
  state: MissionState;
  actions: MissionActions;
}

export default function MissionTypeGibberish({ mission, state, actions }: Props) {
  return (
    <div className="mission mission--type">
      <div className="mission__icon">⌨️</div>
      <h2 className="mission__label">{mission.label}</h2>
      <p className="mission__desc">{mission.description}</p>

      <div className="mission__gibberish-target">
        {mission.payload?.split('').map((char, i) => {
          const typed = state.inputValue[i];
          const isCorrect = typed === char;
          const isTyped = typed !== undefined;
          return (
            <motion.span
              key={i}
              className={`mission__gibberish-char ${
                isTyped ? (isCorrect ? 'mission__gibberish-char--correct' : 'mission__gibberish-char--wrong') : ''
              }`}
              animate={isTyped && !isCorrect ? { x: [0, -3, 3, -3, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              {char}
            </motion.span>
          );
        })}
      </div>

      <input
        className="mission__type-input"
        type="text"
        value={state.inputValue}
        onChange={(e) => actions.handleInput(e.target.value)}
        placeholder="위 글자를 정확히 입력하세요"
        autoFocus
        disabled={state.isComplete}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {state.isComplete && (
        <motion.div
          className="mission__complete-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          ✅ 정확해요!
        </motion.div>
      )}
    </div>
  );
}
