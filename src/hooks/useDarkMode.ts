import { useState, useEffect } from 'react';

export const useDarkMode = (): boolean => {
  // ブラウザのprefers-color-schemeを検出
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // 状態を管理
  const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode);
  
  useEffect(() => {
    // メディアクエリでシステム設定の変更を監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 設定変更時のハンドラー
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    // イベントリスナーを追加
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // 旧APIのサポート（Safari用）
      mediaQuery.addListener(handleChange);
    }
    
    // クリーンアップ関数
    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // 旧APIのサポート（Safari用）
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);
  
  return isDarkMode;
}; 