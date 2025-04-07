import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import SubjectEditModal from '../components/home/SubjectEditModal';
import { useAppContext } from '../contexts/AppContext';
import { Subject } from '../types';
import { useNavigate } from 'react-router-dom';
import { SubjectCard } from '../components/home/SubjectCard';
import { NavigationBar } from '../components/common/NavigationBar';
import { storage } from '../utils/storage';
import { useDarkMode } from '../hooks/useDarkMode';

export default function HomeScreen() {
  const { state, dispatch } = useAppContext();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isDarkMode = useDarkMode(); // ダークモード検出

  // データ読み込み完了時の処理
  useEffect(() => {
    if (!state.isLoading) {
      console.log('データ読み込み完了');
      setIsLoading(false);
    }
  }, [state.isLoading]);

  // 科目を追加する処理
  const handleAddSubject = useCallback(() => {
    setEditingSubject(null);
    setIsModalOpen(true);
  }, []);

  // 科目を編集する処理
  const handleEditSubject = useCallback((subject: Subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  }, []);

  // 科目を削除する処理
  const handleDeleteSubject = useCallback(async (subjectId: string) => {
    try {
      // 確認ダイアログを表示
      if (window.confirm('この科目を削除してもよろしいですか？')) {
        // まずステートを更新
        dispatch({ type: 'DELETE_SUBJECT', payload: subjectId });
        
        // ストレージから削除
        await storage.deleteSubject(subjectId);
      }
    } catch (error) {
      console.error('Failed to delete subject:', error);
      alert('科目の削除に失敗しました。もう一度お試しください。');
    }
  }, [dispatch]);

  // モーダルを閉じる処理
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingSubject(null);
  }, []);

  // タイマーを開始する処理
  const handleStartTimer = useCallback((subject: Subject) => {
    console.log(`タイマー開始: ${subject.name}`, subject.id);
    dispatch({ type: 'SET_CURRENT_SUBJECT', payload: subject });
    dispatch({ type: 'SET_TIMER_RUNNING', payload: true });
    navigate(`/timer/${subject.id}`);
  }, [dispatch, navigate]);

  // ローディング中は読み込み中表示
  if (isLoading) {
    return (
      <div className={`app-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
        <p className="text-lg">データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="app-screen">
      <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} h-full`}>
        <div className="p-6 pb-20"> {/* タブバーの高さ分の下部パディングを追加 */}
          <h1 className={`text-5xl font-bold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Home</h1>
          
          <div className="grid grid-cols-2 gap-6">
            {state.subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onEdit={() => handleEditSubject(subject)}
                onDelete={() => handleDeleteSubject(subject.id)}
                onStart={() => handleStartTimer(subject)}
              />
            ))}
            
            {/* 最後に追加ボタンを配置 */}
            <div className="flex flex-col">
              <div 
                className={`rounded-card aspect-square flex items-center justify-center cursor-pointer ${
                  isDarkMode ? 'bg-gray-800' : 'bg-card-bg'
                }`}
                onClick={handleAddSubject}
              >
                <PlusIcon className={`w-10 h-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-300'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* モーダル */}
        {isModalOpen && (
          <SubjectEditModal
            open={isModalOpen}
            onClose={handleCloseModal}
            subject={editingSubject || undefined}
            isEdit={!!editingSubject}
          />
        )}
        
        {/* ナビゲーションバー */}
        <NavigationBar />
      </div>
    </div>
  );
} 