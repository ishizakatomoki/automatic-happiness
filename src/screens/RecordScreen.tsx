import React, { useEffect } from 'react';
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
  
  const subject = state.isLoading ? null : state.subjects.find(s => s.id === subjectId);
  
  useEffect(() => {
    if (state.isLoading || !subjectId) return;

    if (!subject) {
      console.error(`Subject with id ${subjectId} not found. Navigating home.`);
      navigate('/');
    } else {
      dispatch({ type: 'SET_CURRENT_SUBJECT', payload: subject });
      localStorage.setItem(CURRENT_ROUTE_KEY, `/timer/${subjectId}`);
    }
  }, [subjectId, state.subjects, state.isLoading, navigate, dispatch]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (state.isLoading || !subject) return;
      
      if (!document.hidden) {
        console.log('Timer screen restored on visibility change');
        const currentPath = window.location.hash;
        const expectedPath = `#/timer/${subjectId}`;
        if (currentPath !== expectedPath) {
          console.log(`Navigating from ${currentPath} to ${expectedPath}`);
          navigate(`/timer/${subjectId}`);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
  
  if (state.isLoading || !subject) {
    return (
      <div className={`app-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        Loading...
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
    navigate('/');
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