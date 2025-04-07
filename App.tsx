import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { BottomTab } from './components/common/BottomTab';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import RecordScreen from './screens/RecordScreen';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/record/:subjectId" element={<RecordScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
          </Routes>
          <BottomTab />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
