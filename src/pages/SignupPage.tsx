import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Check, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import Input from '../components/Input';
import Button from '../components/Button';
import { authApi } from '../services/api';
import './SignupPage.css';

export default function SignupPage() {
  const navigate = useNavigate();
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  // Flow State
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(180); // 3분 타이머
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 이메일 인증코드 요청
  const handleRequestCode = async () => {
    if (!email) return;
    setError('');
    setIsLoading(true);

    try {
      await authApi.sendCode(email);
      setIsCodeSent(true);
      setTimer(180);
      
      // Timer logic
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증코드 전송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 인증코드 검증
  const handleVerifyCode = async () => {
    if (!email || !verifyCode) return;
    setError('');
    setIsLoading(true);

    try {
      await authApi.verifyCode(email, verifyCode);
      setIsVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증코드가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 완료
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !isVerified) return;
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.signup(email, password, name);
      localStorage.setItem('token', response.token);
      localStorage.setItem('userId', String(response.userId));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', response.name);
      localStorage.setItem('email', response.email);

      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <div className="signup-page">
      <div className="signup-page__bg" />

      <motion.div
        className="signup-page__content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="signup-page__header">
          <Logo size={48} />
          <h1 className="signup-page__title">회원가입</h1>
        </div>

        {error && (
          <motion.div
            className="signup-page__error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <form className="signup-page__form" onSubmit={handleSignup}>
          {/* 1. 이름 */}
          <Input
            id="name"
            label="이름"
            placeholder="홍길동"
            icon={<User size={18} />}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* 2. 이메일 & 인증요청 */}
          <div className="signup-page__email-group">
            <Input
              id="email"
              type="email"
              label="이메일"
              placeholder="example@email.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isCodeSent}
            />
            <Button
              type="button"
              size="sm"
              className="signup-page__verify-btn"
              onClick={handleRequestCode}
              disabled={isCodeSent || !email || isLoading}
            >
              {isCodeSent ? '전송됨' : '인증요청'}
            </Button>
          </div>

          {/* 3. 인증번호 입력 & 검증 (조건부 렌더링) */}
          <AnimatePresence>
            {isCodeSent && !isVerified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="signup-page__code-section"
              >
                <div className="signup-page__code-row">
                  <Input
                    id="code"
                    label="인증번호"
                    placeholder="6자리 코드 입력"
                    icon={<Check size={18} />}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="signup-page__code-confirm-btn"
                    onClick={handleVerifyCode}
                    disabled={verifyCode.length < 6 || isLoading}
                  >
                    확인
                  </Button>
                </div>
                <span className="signup-page__timer">
                  {minutes}:{String(seconds).padStart(2, '0')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3-1. 검증 완료 배지 */}
          <AnimatePresence>
            {isVerified && (
              <motion.div
                className="signup-page__verified-badge"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                <ShieldCheck size={18} />
                <span>이메일 인증 완료</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 4. 비밀번호 */}
          <Input
            id="password"
            type="password"
            label="비밀번호"
            placeholder="8자 이상 입력하세요"
            icon={<Lock size={18} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button 
            type="submit" 
            fullWidth 
            size="lg" 
            disabled={!isVerified || !name || !email || !password || isLoading}
          >
            {isLoading ? '처리 중...' : '가입하기'}
          </Button>
        </form>

        <p className="signup-page__login-link">
          이미 계정이 있으신가요?{' '}
          <button onClick={() => navigate('/')}>로그인</button>
        </p>
      </motion.div>
    </div>
  );
}
