import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { groupApi, alarmApi, timeApi } from '../services/api';
import type { Alarm, ServerDayOfWeek } from '../types';

const SERVER_DAYS: ServerDayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function AlarmMonitor() {
  const navigate = useNavigate();
  const location = useLocation();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const lastCheckMinute = useRef<number>(-1);

  // 1. 모든 알람 정보 로드 (1분마다 갱신)
  useEffect(() => {
    const fetchAllAlarms = async () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const token = localStorage.getItem('token'); // 토큰 체크 추가
      if (!isLoggedIn || !token) return;

      try {
        const groups = await groupApi.getAll();
        const allAlarms: Alarm[] = [];
        for (const group of groups) {
          const groupAlarms = await alarmApi.getByGroup(group.id);
          allAlarms.push(...groupAlarms);
        }
        setAlarms(allAlarms);
      } catch (err) {
        console.error('알람 모니터 데이터 로드 실패:', err);
      }
    };

    fetchAllAlarms();
    const interval = setInterval(fetchAllAlarms, 60000);
    return () => clearInterval(interval);
  }, []);

  // 2. 매 10초마다 시간 체크 (서버 시간 기반)
  useEffect(() => {
    const checkAlarms = async () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const token = localStorage.getItem('token'); // 토큰 체크 추가
      const isAlreadyRinging = location.pathname.includes('/alarm-ring');
      if (!isLoggedIn || !token || isAlreadyRinging) return;

      try {
        const serverTime = await timeApi.getCurrent();
        const { hour, minute } = serverTime;

        const currentMinute = hour * 60 + minute;
        if (lastCheckMinute.current === currentMinute) return;
        lastCheckMinute.current = currentMinute;

        const date = new Date(serverTime.datetime);
        const today = SERVER_DAYS[date.getDay()];

        const matchingAlarm = alarms.find(alarm =>
          alarm.isActive &&
          alarm.hour === hour &&
          alarm.minute === minute &&
          alarm.repeatDays.includes(today)
        );

        if (matchingAlarm) {
          console.log('⏰ 알람 작동!', matchingAlarm);
          navigate(`/alarm-ring/${matchingAlarm.id}`);
        }
      } catch {
        // 백엔드 /time/current 실패 시 로컬 시계 사용
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const currentMinute = h * 60 + m;

        if (lastCheckMinute.current === currentMinute) return;
        lastCheckMinute.current = currentMinute;

        const today = SERVER_DAYS[now.getDay()];
        const matchingAlarm = alarms.find(alarm =>
          alarm.isActive &&
          alarm.hour === h &&
          alarm.minute === m &&
          alarm.repeatDays.includes(today)
        );

        if (matchingAlarm) {
          navigate(`/alarm-ring/${matchingAlarm.id}`);
        }
      }
    };

    const interval = setInterval(checkAlarms, 10000);
    return () => clearInterval(interval);
  }, [alarms, location.pathname, navigate]);

  return null;
}