export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Group {
  id: number;
  name: string;
  inviteCode: string;
  createdByUserId: number;
}


export type MissionType = 'SHAKE' | 'TAP' | 'TYPE_GIBBERISH' | 'MATH' | 'PATTERN';

export interface Mission {
  type: MissionType;
  label: string;
  description: string;
  targetValue: number;
  payload?: string; // For TYPE_GIBBERISH
  answer?: number; // For MATH
  patternSequence?: number[]; // For PATTERN
}

export type DayOfWeek = "월" | "화" | "수" | "목" | "금" | "토" | "일";

// 서버 repeatDays 형식: "MON,TUE,WED"
export type ServerDayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export const DAY_MAP: Record<DayOfWeek, ServerDayOfWeek> = {
  '월': 'MON',
  '화': 'TUE',
  '수': 'WED',
  '목': 'THU',
  '금': 'FRI',
  '토': 'SAT',
  '일': 'SUN',
};

export const REVERSE_DAY_MAP: Record<ServerDayOfWeek, DayOfWeek> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
};

export interface Alarm {
  id: number;
  alarmId?: number; // Backend variation
  title: string;
  hour: number;
  minute: number;
  repeatDays: string; // "MON,TUE..."
  isActive: boolean;
}

export interface MemberMissionStatus {
  userId: number;
  name: string;
  completed: boolean;
}

// ─── Auth 관련 ───

export interface AuthResponse {
  userId: number;
  token: string;
  email: string;
  name: string;
}


// ─── 서버 미션 응답 ───

export interface ServerMission {
  id: number;
  type: MissionType;
  label: string;
  description: string;
  payload: string;
  targetValue: number;
  patternSequence?: number[];
}


// ─── 벌칙 관련 ───

export interface PenaltyPhrase {
  phrase: string;
}

export interface PenaltyVoiceUploadResponse {
  voiceUrl: string;
}

// ─── WebSocket 메시지 ───

export interface PenaltyStartMessage {
  userId: number;
  userName: string;
  message: string;
}

export interface PenaltyVoiceMessage {
  userId: number;
  userName: string;
  voiceUrl: string;
  message: string;
}

// ─── 서버 시간 ───

export interface ServerTime {
  datetime: string;
  hour: number;
  minute: number;
  second: number;
  timezone: string;
}

// ─── 요일 변환 유틸 ───

export function toServerDays(days: DayOfWeek[]): string {
  return days.map((d) => DAY_MAP[d]).join(',');
}

export function fromServerDays(serverDays: string): DayOfWeek[] {
  if (!serverDays) return [];
  return serverDays.split(',').map((d) => REVERSE_DAY_MAP[d.trim() as ServerDayOfWeek]).filter(Boolean);
}
