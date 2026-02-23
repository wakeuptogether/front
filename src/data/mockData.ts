import type { User, Group, Alarm, AlarmCompletion } from '../types';

export const currentUser: User = {
  id: 'u1',
  name: '김민수',
  email: 'minsu@example.com',
};

export const users: User[] = [
  currentUser,
  { id: 'u2', name: '이지은', email: 'jieun@example.com' },
  { id: 'u3', name: '박서연', email: 'seoyeon@example.com' },
  { id: 'u4', name: '정우진', email: 'woojin@example.com' },
  { id: 'u5', name: '최하늘', email: 'haneul@example.com' },
];

export const groups: Group[] = [
  {
    id: 'g1',
    name: '아침 러닝 크루 🏃',
    members: [users[0], users[1], users[2], users[3]],
    createdBy: 'u1',
    inviteCode: 'RUN2024',
  },
  {
    id: 'g2',
    name: '스터디 그룹 📚',
    members: [users[0], users[1], users[4]],
    createdBy: 'u2',
    inviteCode: 'STUDY24',
  },
  {
    id: 'g3',
    name: '가족 모닝콜 ☀️',
    members: [users[0], users[2]],
    createdBy: 'u1',
    inviteCode: 'FAM2024',
  },
];

export const alarms: Alarm[] = [
  {
    id: 'a1',
    groupId: 'g1',
    title: '조깅 출발!',
    hour: 6,
    minute: 30,
    repeatDays: ['월', '수', '금'],
    createdBy: 'u1',
    isActive: true,
  },
  {
    id: 'a2',
    groupId: 'g1',
    title: '주말 러닝',
    hour: 7,
    minute: 0,
    repeatDays: ['토', '일'],
    createdBy: 'u1',
    isActive: true,
  },
  {
    id: 'a3',
    groupId: 'g2',
    title: '아침 독서 시간',
    hour: 7,
    minute: 30,
    repeatDays: ['월', '화', '수', '목', '금'],
    createdBy: 'u2',
    isActive: true,
  },
  {
    id: 'a4',
    groupId: 'g3',
    title: '가족 모닝콜',
    hour: 8,
    minute: 0,
    repeatDays: ['월', '화', '수', '목', '금', '토', '일'],
    createdBy: 'u1',
    isActive: true,
  },
];

const today = new Date().toISOString().split('T')[0];

export const completions: AlarmCompletion[] = [
  { alarmId: 'a1', userId: 'u1', date: today, completedAt: new Date().toISOString() },
  { alarmId: 'a1', userId: 'u2', date: today, completedAt: new Date().toISOString() },
  { alarmId: 'a1', userId: 'u3', date: today },
  { alarmId: 'a1', userId: 'u4', date: today },
  { alarmId: 'a3', userId: 'u1', date: today, completedAt: new Date().toISOString() },
  { alarmId: 'a3', userId: 'u2', date: today },
  { alarmId: 'a3', userId: 'u5', date: today },
];

export function getGroupAlarms(groupId: string): Alarm[] {
  return alarms.filter((a) => a.groupId === groupId);
}

export function getAlarmCompletions(alarmId: string, date: string): AlarmCompletion[] {
  return completions.filter((c) => c.alarmId === alarmId && c.date === date);
}

export function getCompletionRate(alarmId: string, groupId: string, date: string) {
  const group = groups.find((g) => g.id === groupId);
  if (!group) return { completed: 0, total: 0 };
  const alarmCompletions = getAlarmCompletions(alarmId, date);
  const completed = alarmCompletions.filter((c) => c.completedAt).length;
  return { completed, total: group.members.length };
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
