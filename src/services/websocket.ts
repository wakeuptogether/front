import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { PenaltyStartMessage, PenaltyVoiceMessage } from '../types';

export type WebSocketEventMap = {
  'penalty-start': PenaltyStartMessage;
  'penalty-voice': PenaltyVoiceMessage;
};

type EventHandler<T> = (data: T) => void;

/**
 * WebSocket 클라이언트 (SockJS + STOMP)
 *
 * 연결: http://localhost:8080/ws (Vite 프록시를 통해 /ws로 접근)
 * 구독:
 *   /topic/group/{groupId}/penalty-start  → 벌칙 시작 알림
 *   /topic/group/{groupId}/penalty        → 벌칙 음성 도착 알림
 */
export class AlarmWebSocket {
  private client: Client | null = null;
  private handlers: Map<string, Set<EventHandler<unknown>>> = new Map();
  private groupId: number;

  constructor(groupId: number) {
    this.groupId = groupId;
  }

  /** WebSocket 연결 */
  connect() {
    // STOMP Client 설정
    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      debug: (msg: string) => console.log(`[STOMP] ${msg}`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log(`[STOMP] Connected: ${frame.headers['user-name'] || 'unknown'}`);

      // 벌칙 시작 알림 구독
      this.client?.subscribe(`/topic/group/${this.groupId}/penalty-start`, (message) => {
        try {
          const data = JSON.parse(message.body);
          this.emit('penalty-start', data);
        } catch (e) {
          console.warn('[STOMP] Failed to parse penalty-start message:', e);
        }
      });

      // 벌칙 음성 알림 구독
      this.client?.subscribe(`/topic/group/${this.groupId}/penalty`, (message) => {
        try {
          const data = JSON.parse(message.body);
          this.emit('penalty-voice', data);
        } catch (e) {
          console.warn('[STOMP] Failed to parse penalty message:', e);
        }
      });
    };

    this.client.onStompError = (frame) => {
      console.error('[STOMP] Broker error: ' + frame.headers['message']);
      console.error('[STOMP] Additional details: ' + frame.body);
    };

    this.client.activate();
  }

  /** 연결 해제 */
  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.handlers.clear();
  }

  /** 이벤트 핸들러 등록 */
  on<K extends keyof WebSocketEventMap>(
    event: K,
    handler: EventHandler<WebSocketEventMap[K]>,
  ) {
    const key = event as string;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }
    this.handlers.get(key)!.add(handler as EventHandler<unknown>);

    return () => {
      this.handlers.get(key)!.delete(handler as EventHandler<unknown>);
    };
  }

  /** 메시지 발행 */
  private emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach((handler) => handler(data));
  }
}
