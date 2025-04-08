import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { Timer } from '../components/record/Timer';
import { useAppContext } from '../contexts/AppContext';
import { storage } from '../utils/storage';
import { StudyRecord } from '../types';
import { useDarkMode } from '../hooks/useDarkMode';

// 現在のルートを保存するローカルストレージキー
const CURRENT_ROUTE_KEY = 'current_route';

export default function RecordScreen() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const isDarkMode = useDarkMode(); // ダークモード検出
  const [error, setError] = useState<string | null>(null); // エラー状態を追加
  
  // isLoading完了後に subject を検索
  const subject = !state.isLoading && subjectId ? state.subjects.find(s => s.id === subjectId) : null;
  
  useEffect(() => {
    // subjectId がない場合はホームへ
    if (!subjectId) {
      console.error('No subjectId provided. Navigating home.');
      navigate('/');
      return;
    }
    // ローディング中は待機
    if (state.isLoading) {
      return;
    }
    // subjectが見つからない場合はエラー状態にしてホームへ
    if (!subject) {
      console.error(`Subject with id ${subjectId} not found. Setting error and navigating home.`);
      setError(`Subject with id ${subjectId} not found.`); // エラーメッセージを設定
      // すぐにナビゲートせず、エラーメッセージを表示できるようにする
      // navigate('/');
      return; // このeffectの以降の処理をスキップ
    } else {
      // subjectが見つかった場合、エラーをクリアし、現在のSubjectを設定、ルートを保存
      setError(null); // エラー状態をクリア
      dispatch({ type: 'SET_CURRENT_SUBJECT', payload: subject });
      localStorage.setItem(CURRENT_ROUTE_KEY, `/timer/${subjectId}`);
    }
    // subject も依存配列に追加
  }, [subjectId, subject, state.subjects, state.isLoading, navigate, dispatch]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      // isLoading完了前、またはsubjectが存在しない場合は何もしない
      if (state.isLoading || !subject) return;

      if (!document.hidden) {
        console.log('Timer screen restored on visibility change');
        const currentPath = window.location.hash;
        const expectedPath = `#/timer/${subjectId}`;
        if (currentPath !== expectedPath) {
          console.log(`Navigating from ${currentPath} to ${expectedPath}`);
          const path = `timer/${subjectId}`;
          console.log('[RecordScreen/Visibility] Navigating to:', path); // ログ出力追加
          navigate(path);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // subject も依存配列に追加
  }, [subject, subjectId, navigate, state.isLoading]);
  
  const handleRecordTime = (duration: number) => {
    console.log("handleRecordTime called with duration:", duration);
    
    if (subject) {
      const now = new Date();
      const startTime = new Date(now.getTime() - duration * 1000);
      
      const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
      };
      
      const studyRecord: StudyRecord = {
        id: generateId(),
        subjectId: subject.id,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        duration,
      };
      
      console.log("Study record created:", studyRecord);
      
      dispatch({ type: 'ADD_STUDY_RECORD', payload: studyRecord });
      storage.addStudyRecord(studyRecord);
      
      console.log("Navigating to home page...");
      
      localStorage.removeItem(CURRENT_ROUTE_KEY);
      navigate('/');
    }
  };
  
  // ローディング中の表示
  if (state.isLoading) {
    return (
      <div className={`app-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        Loading...
      </div>
    );
  }

  // エラー発生時の表示
  if (error) {
    return (
      <div className={`app-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={() => navigate('/')}
          className={`px-4 py-2 rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  // subjectが見つからない場合（エラー前、またはローディング完了直後）の表示
  if (!subject) {
    return (
      <div className={`app-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        Subject not found. Redirecting...
      </div>
    );
  }
  
  // ダークモードに応じた色の設定
  const colors = {
    background: isDarkMode ? '#121212' : 'white',
    text: isDarkMode ? '#f0f0f0' : '#000000',
    buttonBg: isDarkMode ? '#2a2a2a' : '#f3f4f6',
    buttonText: isDarkMode ? '#60a5fa' : '#2563eb',
    shadow: isDarkMode ? '0 1px 3px rgba(255,255,255,0.05)' : '0 1px 3px rgba(0,0,0,0.1)'
  };
  
  // 戻るボタンのクリック処理
  const handleBackClick = () => {
    localStorage.removeItem(CURRENT_ROUTE_KEY);
    const path = '/';
    console.log('[RecordScreen/BackClick] Navigating to:', path); // ログ出力追加
    navigate(path);
  };
  
  return (
    <div className="app-screen" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: colors.background,
      position: 'relative',
      color: colors.text,
      transition: 'background-color 0.3s, color 0.3s',
      overflow: 'hidden'
    }}>
      {/* ヘッダー部分 */}
      <div style={{ padding: '20px', paddingTop: '40px' }}>
        {/* 戻るボタン */}
        <button
          onClick={handleBackClick}
          style={{
            position: 'absolute',
            left: '20px',
            top: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.buttonBg,
            borderRadius: '50%',
            padding: '12px',
            boxShadow: colors.shadow,
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background-color 0.3s'
          }}
        >
          <ChevronLeftIcon className="w-6 h-6" style={{ color: colors.buttonText }} />
        </button>
        
        {/* タイトル */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginTop: '60px',
          width: '100%',
          color: colors.text
        }}>
          {subject.name}
        </h1>
      </div>
      
      {/* タイマー配置 - 垂直方向中央 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: '1',
        marginTop: '-20px' // 見た目を調整
      }}>
        <Timer onRecordTime={handleRecordTime} />
      </div>
    </div>
  );
} 