import { useRef, useEffect, useState } from 'react';
import './TimePicker.css';

interface TimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

function WheelColumn({
  items,
  value,
  onChange,
}: {
  items: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const itemHeight = 56;
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (ref.current && !isScrolling) {
      const idx = items.indexOf(value);
      ref.current.scrollTop = idx * itemHeight;
    }
  }, [value, items, isScrolling]);

  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = () => {
    if (!ref.current) return;
    setIsScrolling(true);
    const idx = Math.round(ref.current.scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    
    if (items[clamped] !== value) {
      onChange(items[clamped]);
    }
    
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      setIsScrolling(false);
      if (ref.current) {
        ref.current.scrollTo({ top: clamped * itemHeight, behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <div className="time-picker__wheel" ref={ref} onScroll={handleScroll}>
      <div className="time-picker__spacer" style={{ height: itemHeight }} />
      {items.map((item) => (
        <div
          key={item}
          className={`time-picker__item ${item === value ? 'time-picker__item--active' : ''}`}
          style={{ height: itemHeight }}
          onClick={() => onChange(item)}
        >
          {String(item).padStart(2, '0')}
        </div>
      ))}
      <div className="time-picker__spacer" style={{ height: itemHeight }} />
    </div>
  );
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i); // 분 단위를 1분 단위로 (요청 이미지 반영)

export default function TimePicker({ hour, minute, onChange }: TimePickerProps) {
  return (
    <div className="time-picker">
      <div className="time-picker__labels">
        <span className="time-picker__label">시</span>
        <span className="time-picker__label">분</span>
      </div>
      <div className="time-picker__wheels">
        <WheelColumn items={hours} value={hour} onChange={(h) => onChange(h, minute)} />
        <span className="time-picker__sep">:</span>
        <WheelColumn items={minutes} value={minute} onChange={(m) => onChange(hour, m)} />
      </div>
    </div>
  );
}
