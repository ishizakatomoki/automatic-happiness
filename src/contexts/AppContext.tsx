import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Subject } from '../types';
import { storage } from '../utils/storage';

// 初期科目データ
const initialSubjects: Subject[] = [
  {
    id: 'subject-1',
    name: 'English',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'subject-2',
    name: 'History',
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'subject-3',
    name: 'Math',
    imageUrl: 'https://images.unsplash.com/photo-1567360425618-1594206637d2?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'subject-4',
    name: 'Biology',
    imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'subject-5',
    name: 'Music',
    imageUrl: 'https://images.unsplash.com/photo-1558584673-c834fb1cc3d0?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

const initialState: AppState = {
  subjects: [],
  studyRecords: [],
  currentSubject: null,
  isTimerRunning: false,
  isLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_SUBJECT':
      return {
        ...state,
        subjects: [...state.subjects, action.payload],
      };
    case 'UPDATE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.map((subject) =>
          subject.id === action.payload.id ? action.payload : subject
        ),
      };
    case 'DELETE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.filter((subject) => subject.id !== action.payload),
      };
    case 'ADD_STUDY_RECORD':
      return {
        ...state,
        studyRecords: [...state.studyRecords, action.payload],
      };
    case 'SET_CURRENT_SUBJECT':
      return {
        ...state,
        currentSubject: action.payload,
      };
    case 'SET_TIMER_RUNNING':
      return {
        ...state,
        isTimerRunning: action.payload,
      };
    case 'INITIALIZE_SUBJECTS':
      return {
        ...state,
        subjects: action.payload,
      };
    case 'INITIALIZE_RECORDS':
      return {
        ...state,
        studyRecords: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // LocalStorageからデータを非同期で読み込む
  useEffect(() => {
    const loadData = async () => {
      try {
        // ローディング状態を設定
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // 科目データを読み込む
        const loadedSubjects = await storage.getSubjects();
        
        // 科目がない場合は初期データをロード
        if (loadedSubjects.length === 0) {
          console.log('No subjects found, initializing with default data');
          await storage.setSubjects(initialSubjects);
          dispatch({ type: 'INITIALIZE_SUBJECTS', payload: initialSubjects });
        } else {
          console.log(`Loaded ${loadedSubjects.length} subjects`);
          dispatch({ type: 'INITIALIZE_SUBJECTS', payload: loadedSubjects });
        }
        
        // 学習記録を読み込む
        const loadedRecords = await storage.getStudyRecords();
        if (loadedRecords.length > 0) {
          console.log(`Loaded ${loadedRecords.length} study records`);
          dispatch({ type: 'INITIALIZE_RECORDS', payload: loadedRecords });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // エラー時にもデフォルトデータを設定
        dispatch({ type: 'INITIALIZE_SUBJECTS', payload: initialSubjects });
      } finally {
        // ローディング状態を解除
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  // 科目データが変更されたら保存
  useEffect(() => {
    // 初期ロード中は保存しない
    if (state.isLoading) return;
    
    // 科目データを保存
    const saveSubjects = async () => {
      try {
        await storage.setSubjects(state.subjects);
        console.log('Subjects saved to storage');
      } catch (error) {
        console.error('Failed to save subjects:', error);
      }
    };
    
    saveSubjects();
  }, [state.subjects, state.isLoading]);

  // 学習記録が変更されたら保存
  useEffect(() => {
    // 初期ロード中は保存しない
    if (state.isLoading) return;
    
    // 学習記録を保存
    const saveRecords = async () => {
      try {
        await storage.setStudyRecords(state.studyRecords);
        console.log('Study records saved to storage');
      } catch (error) {
        console.error('Failed to save study records:', error);
      }
    };
    
    saveRecords();
  }, [state.studyRecords, state.isLoading]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 