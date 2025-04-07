import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import RecordScreen from './screens/RecordScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

// ルート情報のローカルストレージキー
const CURRENT_ROUTE_KEY = 'current_route';

// ルート管理コンポーネント
function RouteManager() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 初期表示時にローカルストレージからルート情報を取得して復元
  useEffect(() => {
    const savedRoute = localStorage.getItem(CURRENT_ROUTE_KEY);
    
    // ルートの自動復元はタイマー画面の場合のみ
    if (savedRoute && savedRoute.startsWith('/timer/') && location.pathname === '/') {
      console.log('Restoring saved route:', savedRoute);
      navigate(savedRoute);
    }
  }, [navigate, location]);
  
  // 現在のルートを監視して保存
  useEffect(() => {
    // タイマー画面のパスのみ記録
    if (location.pathname.startsWith('/timer/')) {
      localStorage.setItem(CURRENT_ROUTE_KEY, location.pathname);
    }
  }, [location]);
  
  return null;
}

function App() {
  // PWA向けの設定
  useEffect(() => {
    // スクロールバウンスなどのネイティブ挙動を抑制
    document.body.classList.add('overscroll-none');
    
    // iOS Safariのアドレスバーを隠す
    const hideAddressBar = () => {
      if (document.documentElement.scrollHeight > window.innerHeight) {
        setTimeout(() => window.scrollTo(0, 1), 0);
      }
    };
    
    window.addEventListener('load', hideAddressBar);
    window.addEventListener('orientationchange', hideAddressBar);
    
    return () => {
      window.removeEventListener('load', hideAddressBar);
      window.removeEventListener('orientationchange', hideAddressBar);
    };
  }, []);
  
  return (
    <AppProvider>
      <ErrorBoundary>
        <div className="flex flex-col min-h-screen bg-white">
          {/* RouteManagerはHashRouterの中にあるべきなので、ここに置くのは適切ではない可能性がある */}
          {/* <RouteManager /> */}
          <main className="flex-1">
            <Routes>
              {/* HashRouterの場合、ルートパスはスラッシュで始めない */}
              <Route path="" element={<HomeScreen />} /> {/* ホーム */} 
              <Route path="record/:subjectId" element={<RecordScreen />} />
              <Route path="timer/:subjectId" element={<RecordScreen />} />
              <Route path="history" element={<HistoryScreen />} />
            </Routes>
          </main>
        </div>
      </ErrorBoundary>
    </AppProvider>
  );
}

export default App;
