import type { Mission } from '../../types';
import type { MissionState, MissionActions } from '../../missions/useMission';
import MissionShake from './MissionShake';
import MissionTap from './MissionTap';
import MissionTypeGibberish from './MissionTypeGibberish';
import MissionMath from './MissionMath';
import MissionPattern from './MissionPattern';

interface Props {
  mission: Mission;
  state: MissionState;
  actions: MissionActions;
}

export default function MissionRenderer({ mission, state, actions }: Props) {
  switch (mission.type) {
    case 'SHAKE':
      return <MissionShake mission={mission} state={state} actions={actions} />;
    case 'TAP':
      return <MissionTap mission={mission} state={state} actions={actions} />;
    case 'TYPE_GIBBERISH':
      return <MissionTypeGibberish mission={mission} state={state} actions={actions} />;
    case 'MATH':
      return <MissionMath mission={mission} state={state} actions={actions} />;
    case 'PATTERN':
      return <MissionPattern mission={mission} state={state} actions={actions} />;
  }
}
