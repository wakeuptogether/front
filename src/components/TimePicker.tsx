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
  label,
}: {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
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

  const handleScroll = () => {
    if (!ref.current) return;
    setIsScrolling(true);
    const idx = Math.round(ref.current.scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] !== value) {
      onChange(items[clamped]);
    }
    clearTimeout((ref.current as any)._scrollTimer);
    (ref.current as any)._scrollTimer = setTimeout(() => {
      setIsScrolling(false);
      if (ref.current) {
        ref.current.scrollTo({ top: clamped * itemHeight, behavior: 'smooth' });
      }
    }, 120);
  };

  return (
    <div className="time-picker__col">
      <span className="time-picker__col-label">{label}</span>
      <div className="time-picker__wheel" ref={ref} onScroll={handleScroll}>
        <div style={{ height: itemHeight * 2 }} />
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
        <div style={{ height: itemHeight * 2 }} />
      </div>
    </div>
  );
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

export default function TimePicker({ hour, minute, onChange }: TimePickerProps) {
  return (
    <div className="time-picker">
      <WheelColumn items={hours} value={hour} onChange={(h) => onChange(h, minute)} label="시" />
      <span className="time-picker__sep">:</span>
      <WheelColumn items={minutes} value={minute} onChange={(m) => onChange(hour, m)} label="분" />
    </div>
  );
}
