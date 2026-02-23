import type { Mission, MissionType } from '../types';

// ─── 한글 랜덤 문자열 생성 ───
const INITIAL_CONSONANTS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const VOWELS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const FINAL_CONSONANTS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomKoreanChar(): string {
  const cho = randomInt(0, INITIAL_CONSONANTS.length - 1);
  const jung = randomInt(0, VOWELS.length - 1);
  const jong = randomInt(0, FINAL_CONSONANTS.length - 1);
  // Unicode Korean syllable = 0xAC00 + (cho * 21 + jung) * 28 + jong
  const code = 0xAC00 + (cho * 21 + jung) * 28 + jong;
  return String.fromCharCode(code);
}

function generateGibberish(length: number = 6): string {
  return Array.from({ length }, () => generateRandomKoreanChar()).join('');
}

// ─── 수학 문제 생성 ───
interface MathProblem {
  expression: string;
  answer: number;
}

function generateMathProblem(): MathProblem {
  const ops = ['+', '-', '×'] as const;
  const op = ops[randomInt(0, ops.length - 1)];

  let a: number, b: number, answer: number;
  switch (op) {
    case '+':
      a = randomInt(10, 99);
      b = randomInt(10, 99);
      answer = a + b;
      break;
    case '-':
      a = randomInt(30, 99);
      b = randomInt(10, a);
      answer = a - b;
      break;
    case '×':
      a = randomInt(2, 12);
      b = randomInt(2, 12);
      answer = a * b;
      break;
  }

  return { expression: `${a!} ${op} ${b!}`, answer: answer! };
}

// ─── 패턴 생성 (3x3 그리드) ───
function generatePattern(length: number = 5): number[] {
  const cells = Array.from({ length: 9 }, (_, i) => i);
  const pattern: number[] = [];
  for (let i = 0; i < length; i++) {
    const idx = randomInt(0, cells.length - 1);
    pattern.push(cells[idx]);
    cells.splice(idx, 1);
  }
  return pattern;
}

// ─── 미션 생성기 ───
const MISSION_TYPES: MissionType[] = ['SHAKE', 'TAP', 'TYPE_GIBBERISH', 'MATH', 'PATTERN'];

export function generateRandomMission(): Mission {
  const type = MISSION_TYPES[randomInt(0, MISSION_TYPES.length - 1)];
  return generateMission(type);
}

export function generateMission(type: MissionType): Mission {
  switch (type) {
    case 'SHAKE':
      return {
        type: 'SHAKE',
        label: '📱 폰 흔들기',
        description: '폰을 30번 흔드세요!',
        targetValue: 30,
      };

    case 'TAP':
      return {
        type: 'TAP',
        label: '👆 화면 터치',
        description: '화면을 100번 터치하세요!',
        targetValue: 100,
      };

    case 'TYPE_GIBBERISH': {
      const text = generateGibberish(6);
      return {
        type: 'TYPE_GIBBERISH',
        label: '⌨️ 글자 따라 적기',
        description: '아래 글자를 정확히 따라 적으세요!',
        targetValue: 1,
        payload: text,
      };
    }

    case 'MATH': {
      const problem = generateMathProblem();
      return {
        type: 'MATH',
        label: '🧮 수학 문제',
        description: `다음 문제를 풀어보세요!`,
        targetValue: 1,
        payload: problem.expression,
        answer: problem.answer,
      };
    }

    case 'PATTERN': {
      const seq = generatePattern(5);
      return {
        type: 'PATTERN',
        label: '🔲 패턴 따라하기',
        description: '표시되는 패턴 순서를 기억하고 따라 터치하세요!',
        targetValue: seq.length,
        patternSequence: seq,
      };
    }
  }
}
