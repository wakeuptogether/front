export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  members: User[];
  createdBy: string;
  inviteCode: string;
}

export type DayOfWeek = "월" | "화" | "수" | "목" | "금" | "토" | "일";

export type MissionType = 'SHAKE' | 'TAP' | 'TYPE_GIBBERISH' | 'MATH' | 'PATTERN';

export interface Mission {
  type: MissionType;
  label: string;
  description: string;
  targetValue: number;
  payload?: string;        // TYPE_GIBBERISH: 타이핑할 문자열, MATH: "a+b" 형태, PATTERN: "0,3,6,7,8" 순서
  answer?: number;         // MATH 정답
  patternSequence?: number[]; // PATTERN 순서
}

export interface MemberMissionStatus {
  userId: string;
  userName: string;
  mission: Mission;
  progress: number;        // 0 ~ targetValue
  completed: boolean;
  completedAt?: string;
}

export interface Alarm {
  id: string;
  groupId: string;
  title: string;
  hour: number;
  minute: number;
  repeatDays: DayOfWeek[];
  createdBy: string;
  isActive: boolean;
}

export interface AlarmCompletion {
  alarmId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completedAt?: string; // ISO timestamp
}
