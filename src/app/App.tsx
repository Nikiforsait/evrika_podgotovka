import { MotionConfig } from 'framer-motion';
import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { startAutoSync } from '@/data/sync.ts';
import { useProfile } from '@/hooks/data.ts';
import { AuthGate } from './auth/AuthGate.tsx';

const Home = lazy(() => import('./home/HomePage.tsx'));
const Duels = lazy(() => import('./duels/DuelsPage.tsx'));
const DuelPlay = lazy(() => import('./duels/DuelPlayPage.tsx'));
const DiagnosticStart = lazy(() => import('./diagnostic/DiagnosticStartPage.tsx'));
const DiagnosticQuiz = lazy(() => import('./diagnostic/DiagnosticQuizPage.tsx'));
const DiagnosticResult = lazy(() => import('./diagnostic/DiagnosticResultPage.tsx'));
const Profile = lazy(() => import('./profile/ProfilePage.tsx'));
const Topics = lazy(() => import('./topics/TopicsPage.tsx'));
const Plan = lazy(() => import('./plan/PlanPage.tsx'));
const TopicHub = lazy(() => import('./topics/TopicHubPage.tsx'));
const GuidedTask = lazy(() => import('./topics/GuidedTaskPage.tsx'));
const Cards = lazy(() => import('./topics/CardsPage.tsx'));
const Practice = lazy(() => import('./practice/PracticePage.tsx'));
const Handbook = lazy(() => import('./handbook/HandbookPage.tsx'));
const Settings = lazy(() => import('./settings/SettingsPage.tsx'));
const Help = lazy(() => import('./settings/HelpPage.tsx'));
const NotFound = lazy(() => import('./NotFoundPage.tsx'));
const Register = lazy(() => import('./auth/RegisterPage.tsx'));
const Login = lazy(() => import('./auth/LoginPage.tsx'));
const Gift = lazy(() => import('./auth/GiftPage.tsx'));
const Start = lazy(() => import('./start/StartPage.tsx'));
const StartQuiz = lazy(() => import('./start/StartQuizPage.tsx'));
const StartResult = lazy(() => import('./start/StartResultPage.tsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  const profile = useProfile();
  useEffect(() => startAutoSync(), []);

  return (
    <MotionConfig reducedMotion={profile.settings.reducedMotion ? 'always' : 'user'}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
          <AuthGate>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/gift" element={<Gift />} />
            <Route path="/start" element={<Start />} />
            <Route path="/start/quiz" element={<StartQuiz />} />
            <Route path="/start/result" element={<StartResult />} />
            <Route path="/" element={<Home />} />
            <Route path="/duels" element={<Duels />} />
            <Route path="/duels/:duelId" element={<DuelPlay />} />
            <Route path="/diagnostic" element={<DiagnosticStart />} />
            <Route path="/diagnostic/quiz" element={<DiagnosticQuiz />} />
            <Route path="/diagnostic/result" element={<DiagnosticResult />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/topics/:topicId" element={<TopicHub />} />
            <Route path="/topics/:topicId/task" element={<GuidedTask />} />
            <Route path="/topics/:topicId/cards" element={<Cards />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/handbook" element={<Handbook />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthGate>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
  );
}
