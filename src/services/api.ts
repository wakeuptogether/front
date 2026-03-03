import type {
  AuthResponse,
  Group,
  Alarm,
  ServerMission,
  MemberMissionStatus,
  PenaltyPhrase,
  PenaltyVoiceUploadResponse,
  ServerTime,
} from '../types';

// ─── 기본 설정 ───

const BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let errorMessage = `API Error ${res.status}: ${res.statusText}`;
    try {
      const errorJson = JSON.parse(text);
      if (errorJson && errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text as T;
  }
}

// ─── 1. 인증 API ───

export const authApi = {
  /** 인증코드 전송 */
  sendCode(email: string) {
    return request<void>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /** 인증코드 검증 */
  verifyCode(email: string, code: string) {
    return request<void>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  /** 회원가입 */
  signup(email: string, password: string, name: string) {
    return request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  /** 로그인 */
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};

// ─── 2. 그룹 API ───

export const groupApi = {
  /** 그룹 생성 */
  create(name: string) {
    return request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  /** 내 그룹 목록 */
  getAll() {
    return request<Group[]>('/groups');
  },

  /** 그룹 상세 */
  getById(id: number) {
    return request<Group>(`/groups/${id}`);
  },

  /** 초대코드로 참가 */
  join(inviteCode: string) {
    return request<Group>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  },

  /** 그룹 나가기 */
  leave(id: number) {
    return request<void>(`/groups/${id}/leave`, {
      method: 'DELETE',
    });
  },

  /** 그룹 삭제 */
  delete(id: number) {
    return request<void>(`/groups/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─── 3. 알람 API ───

export const alarmApi = {
  /** 알람 생성 */
  create(groupId: number, data: { title: string; hour: number; minute: number; repeatDays: string; isActive: boolean }) {
    return request<Alarm>(`/groups/${groupId}/alarms`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** 그룹 알람 목록 */
  getByGroup(groupId: number) {
    return request<Alarm[]>(`/groups/${groupId}/alarms`);
  },

  /** 알람 수정 */
  update(alarmId: number, data: { title: string; hour: number; minute: number; repeatDays: string; isActive: boolean }) {
    return request<Alarm>(`/alarms/${alarmId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /** 알람 삭제 */
  delete(alarmId: number) {
    return request<void>(`/alarms/${alarmId}`, {
      method: 'DELETE',
    });
  },

  /** 알람 활성/비활성 토글 */
  toggle(alarmId: number, isActive: boolean) {
    return request<void>(`/alarms/${alarmId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },
};

// ─── 4. 미션 API ───

export const missionApi = {
  /** 랜덤 미션 받기 */
  get(alarmId: number) {
    return request<ServerMission>(`/alarms/${alarmId}/mission`);
  },

  /** 미션 완료 보고 */
  complete(alarmId: number) {
    return request<void>(`/alarms/${alarmId}/mission/complete`, {
      method: 'POST',
    });
  },

  /** 그룹 멤버 미션 상태 */
  getStatus(alarmId: number) {
    return request<MemberMissionStatus[]>(`/alarms/${alarmId}/mission/status`);
  },
};

// ─── 5. 벌칙 API ───

export const penaltyApi = {
  /** 랜덤 벌칙 문구 받기 */
  getPhrase(alarmId: number) {
    return request<PenaltyPhrase>(`/alarms/${alarmId}/penalty/phrase`);
  },

  /** 음성 파일 업로드 */
  uploadVoice(alarmId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return request<PenaltyVoiceUploadResponse>(`/alarms/${alarmId}/penalty/voice`, {
      method: 'POST',
      body: formData,
    });
  },

  /** 음성 파일 URL 생성 */
  getVoiceUrl(fileName: string) {
    return `/voices/${fileName}`;
  },
};

// ─── 6. 시간 API ───

export const timeApi = {
  /** 서버 현재 시간 조회 */
  getCurrent() {
    return request<ServerTime>('/time/current');
  },
};
