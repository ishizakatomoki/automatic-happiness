export interface Subject {
  id: string;
  name: string;
  imageUrl: string;
}

export interface StudyRecord {
  id: string;
  subjectId: string;
  startTime: string;
  endTime: string;
  duration: number; // 秒単位
}

export interface AppState {
  subjects: Subject[];
  studyRecords: StudyRecord[];
  currentSubject: Subject | null;
  isTimerRunning: boolean;
  isLoading: boolean; // データのロード状態
}

export type AppAction =
  | { type: 'ADD_SUBJECT'; payload: Subject }
  | { type: 'UPDATE_SUBJECT'; payload: Subject }
  | { type: 'DELETE_SUBJECT'; payload: string }
  | { type: 'ADD_STUDY_RECORD'; payload: StudyRecord }
  | { type: 'SET_CURRENT_SUBJECT'; payload: Subject | null }
  | { type: 'SET_TIMER_RUNNING'; payload: boolean }
  | { type: 'INITIALIZE_SUBJECTS'; payload: Subject[] }
  | { type: 'INITIALIZE_RECORDS'; payload: StudyRecord[] }
  | { type: 'SET_LOADING'; payload: boolean }; 