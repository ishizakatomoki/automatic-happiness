import { Subject, StudyRecord } from '../types';

const SUBJECTS_KEY = 'study-tracker-subjects';
const RECORDS_KEY = 'study-tracker-records';
const DEBUG_STORAGE = true; // デバッグログの表示を制御

// 大きな画像データを処理するための補助関数
function processImageUrl(imageUrl: string): string {
  // 未定義や空の場合はデフォルト画像を返す
  if (!imageUrl) {
    console.log('画像URLが未定義または空のため、デフォルト画像を使用します');
    return '/default-subject.png';
  }
  
  // すでにデフォルト画像の場合は処理不要
  if (imageUrl === '/default-subject.png') {
    return imageUrl;
  }

  // data:image/ で始まるbase64エンコードされた画像の場合
  if (imageUrl.startsWith('data:image/')) {
    // デバッグログ
    if (DEBUG_STORAGE) {
      const originalSize = Math.round(imageUrl.length / 1024);
      console.log(`processImageUrl: 画像サイズ ${originalSize}KB`);
      
      // 大きすぎる画像の場合は警告
      if (originalSize > 1000) {
        console.warn(`警告: 画像サイズが非常に大きいです（${originalSize}KB）`);
      }
    }
    
    // 非常に大きな画像の場合は警告
    if (imageUrl.length > 5 * 1024 * 1024) {
      console.error('警告: 画像サイズが5MBを超えています - ストレージの上限に近づいています');
    }
    
    // 画像データは変更せずにそのまま返す
    return imageUrl;
  }

  // その他のURLはそのまま返す
  return imageUrl;
}

// 非同期でローカルストレージに保存/取得する関数
function safeLocalStorageSet(key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // 保存前のサイズチェック
      const sizeInKB = Math.round(value.length / 1024);
      
      if (DEBUG_STORAGE) {
        console.log(`${key}に保存開始: 約${sizeInKB}KB`);
        
        // 大きすぎるデータの場合は警告
        if (sizeInKB > 5000) {
          console.warn(`保存するデータが非常に大きいです（${sizeInKB}KB）`);
        }
      }
      
      // データを保存
      localStorage.setItem(key, value);
      
      console.log(`${key}に保存完了: 約${sizeInKB}KB`);
      resolve();
    } catch (error) {
      console.error(`${key}への保存エラー:`, error);
      
      // QuotaExceededError の場合、より詳細なエラーメッセージ
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('ストレージ容量超過エラー。大きな画像データがある可能性があります。');
        reject(new Error('ストレージ容量を超えました。画像のサイズを小さくしてみてください。'));
      } else {
        reject(error);
      }
    }
  });
}

function safeLocalStorageGet(key: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const data = localStorage.getItem(key);
      
      if (DEBUG_STORAGE && data) {
        const size = Math.round(data.length / 1024);
        console.log(`${key}から読み込み完了: 約${size}KB`);
      } else {
        console.log(`${key}から読み込み完了`);
      }
      
      resolve(data);
    } catch (error) {
      console.error(`${key}からの読み込みエラー:`, error);
      resolve(null);
    }
  });
}

export const storage = {
  async getSubjects(): Promise<Subject[]> {
    const subjects = await safeLocalStorageGet(SUBJECTS_KEY);
    if (!subjects) return [];
    
    try {
      const parsed = JSON.parse(subjects);
      console.log(`${parsed.length}個の科目データを読み込みました`);
      
      // 科目データの整合性チェック
      const validSubjects = parsed.map((subject: Subject) => ({
        ...subject,
        // imageUrlが存在しない場合はデフォルト画像を設定
        imageUrl: subject.imageUrl || '/default-subject.png',
        // nameが存在しない場合は「無題」を設定
        name: subject.name || '無題',
      }));
      
      return validSubjects;
    } catch (error) {
      console.error('科目データの解析に失敗:', error);
      return [];
    }
  },

  async setSubjects(subjects: Subject[]): Promise<void> {
    try {
      // 画像データを処理
      const processedSubjects = subjects.map(subject => {
        // 画像URLを処理する
        const processedUrl = processImageUrl(subject.imageUrl);
        console.log(`科目「${subject.name}」の画像処理完了`);
        
        return {
          ...subject,
          imageUrl: processedUrl,
        };
      });
      
      // JSONに変換
      const data = JSON.stringify(processedSubjects);
      
      // サイズログ
      const sizeInKB = Math.round(data.length / 1024);
      console.log(`保存する科目データ: ${subjects.length}個, 合計サイズ: 約${sizeInKB}KB`);
      
      // 保存
      await safeLocalStorageSet(SUBJECTS_KEY, data);
      console.log(`${subjects.length}個の科目データを保存しました`);
    } catch (error) {
      console.error('科目データの保存に失敗:', error);
      throw error; // エラーを上位に伝播
    }
  },

  async getStudyRecords(): Promise<StudyRecord[]> {
    const records = await safeLocalStorageGet(RECORDS_KEY);
    if (!records) return [];
    
    try {
      const parsed = JSON.parse(records);
      console.log(`${parsed.length}個の学習記録を読み込みました`);
      return parsed;
    } catch (error) {
      console.error('学習記録の解析に失敗:', error);
      return [];
    }
  },

  async setStudyRecords(records: StudyRecord[]): Promise<void> {
    try {
      const data = JSON.stringify(records);
      await safeLocalStorageSet(RECORDS_KEY, data);
      console.log(`${records.length}個の学習記録を保存しました`);
    } catch (error) {
      console.error('学習記録の保存に失敗:', error);
      throw error;
    }
  },

  async addSubject(subject: Subject): Promise<void> {
    if (!subject || !subject.name) {
      console.error('無効な科目データです: 科目名が必要です');
      throw new Error('科目データが無効です: 科目名を入力してください');
    }
    
    try {
      // 既存の科目を取得
      const subjects = await this.getSubjects();
      
      // 重複IDチェック
      if (subject.id && subjects.some(s => s.id === subject.id)) {
        console.warn(`ID ${subject.id} の科目は既に存在します`);
        // IDを新しく割り当て
        subject.id = Date.now().toString();
      }
      
      // IDがない場合は新規作成
      if (!subject.id) {
        subject.id = Date.now().toString();
      }
      
      // 科目データを整形
      const processedSubject = {
        ...subject,
        id: subject.id,
        name: subject.name.trim(),
        imageUrl: processImageUrl(subject.imageUrl || '/default-subject.png'),
      };
      
      console.log(`科目「${processedSubject.name}」を追加します (ID: ${processedSubject.id})`);
      
      // 科目を追加
      subjects.push(processedSubject);
      
      // 保存
      await this.setSubjects(subjects);
      console.log(`科目「${processedSubject.name}」(${processedSubject.id}) を追加しました`);
      
      return;
    } catch (error) {
      console.error(`科目「${subject.name}」の追加に失敗:`, error);
      throw error;
    }
  },

  async updateSubject(subject: Subject): Promise<void> {
    if (!subject || !subject.id || !subject.name) {
      console.error('無効な科目データです: IDと科目名が必要です');
      throw new Error('科目データが無効です: IDと科目名が必要です');
    }
    
    try {
      console.log(`updateSubject 開始: ID=${subject.id}, 名前=${subject.name}`);
      
      // 既存の科目を取得
      const subjects = await this.getSubjects();
      
      // 更新対象の科目を検索
      const index = subjects.findIndex(s => s.id === subject.id);
      
      if (index === -1) {
        console.error(`ID ${subject.id} の科目が見つかりません`);
        throw new Error(`科目が見つかりません: ${subject.id}`);
      }
      
      // 画像URL処理
      const processedImageUrl = processImageUrl(subject.imageUrl);
      console.log(`科目「${subject.name}」の画像処理完了: サイズ ${Math.round(processedImageUrl.length / 1024)}KB`);
      
      // 更新用のデータを作成（元のデータを保持しつつ更新）
      const updatedSubject = {
        ...subjects[index],
        ...subject,
        name: subject.name.trim(),
        imageUrl: processedImageUrl,
      };
      
      // 古いデータと新しいデータのサイズ比較（デバッグ用）
      if (DEBUG_STORAGE) {
        const oldSize = JSON.stringify(subjects[index]).length;
        const newSize = JSON.stringify(updatedSubject).length;
        console.log(`科目データサイズ変更: ${Math.round(oldSize/1024)}KB → ${Math.round(newSize/1024)}KB`);
      }
      
      // データ更新
      subjects[index] = updatedSubject;
      
      // 保存
      await this.setSubjects(subjects);
      console.log(`科目「${updatedSubject.name}」(${updatedSubject.id}) の更新が完了しました`);
      
      return;
    } catch (error) {
      console.error(`科目「${subject.name}」の更新に失敗:`, error);
      throw error;
    }
  },

  async deleteSubject(subjectId: string): Promise<void> {
    try {
      const subjects = await this.getSubjects();
      const filteredSubjects = subjects.filter(s => s.id !== subjectId);
      
      if (filteredSubjects.length < subjects.length) {
        await this.setSubjects(filteredSubjects);
        console.log(`ID ${subjectId}の科目を削除しました`);
      } else {
        console.warn(`ID ${subjectId}の科目が見つかりません`);
      }
    } catch (error) {
      console.error(`ID ${subjectId}の科目の削除に失敗:`, error);
      throw error;
    }
  },

  async addStudyRecord(record: StudyRecord): Promise<void> {
    try {
      const records = await this.getStudyRecords();
      records.push(record);
      await this.setStudyRecords(records);
      console.log(`科目ID ${record.subjectId}の学習記録を追加しました`);
    } catch (error) {
      console.error('学習記録の追加に失敗:', error);
      throw error;
    }
  },
  
  // 同期メソッド（互換性のため残す）
  getSubjectsSync(): Subject[] {
    try {
      const subjects = localStorage.getItem(SUBJECTS_KEY);
      return subjects ? JSON.parse(subjects) : [];
    } catch (error) {
      console.error('同期的な科目データの取得に失敗:', error);
      return [];
    }
  },
  
  setSubjectsSync(subjects: Subject[]): void {
    try {
      localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
    } catch (error) {
      console.error('同期的な科目データの保存に失敗:', error);
    }
  }
}; 