import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../../declarations/desuite_backend/desuite_backend.did';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { file_management } from '../../../declarations/file_management';
import { notes } from '../../../declarations/notes';
import { task_manager } from '../../../declarations/task_manager';
import { photo_gallery } from '../../../declarations/photo_gallery';
import { expense_tracker } from '../../../declarations/expense_tracker';
import FileManagement from './FileManagement';
import Notes from './Notes';
import PhotoGallery from './PhotoGallery';
import TaskManager from './TaskManager';
import Settings from './Settings';
import Calendar from './Calendar';
import ExpenseTracker from './ExpenseTracker';
import ConfirmationModal from './ConfirmationModal';
import { 
  UserCircle, 
  Folder, 
  Settings as SettingsIcon, 
  ShieldCheck,
  LogOut,
  Pencil,
  FileText,
  Image,
  CheckCircle,
  Calendar as CalendarIcon,
  Home,
  Bell,
  AlertCircle,
  DollarSign
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'files' | 'notes' | 'photos' | 'tasks' | 'calendar' | 'expenses' | 'security' | 'settings'>('overview');
  const [fileCount, setFileCount] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [storageUsage, setStorageUsage] = useState(0);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
    fetchCounts();
  }, []);

  const profilePictureToBlob = (profilePicture: [] | [Uint8Array | number[]]): Blob | null => {
    if (profilePicture.length === 0) return null;
    const data = profilePicture[0];
    return new Blob([data instanceof Uint8Array ? data : new Uint8Array(data)], { type: 'image/jpeg' });
  };

  const fetchUserData = async () => {
    const username = localStorage.getItem('username');
    if (username) {
      try {
        const result = await desuite_backend.getUser(username);
        if ('ok' in result) {
          setUser(result.ok);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    } else {
      navigate('/login');
    }
  };

  const fetchCounts = async () => {
    setCountsLoading(true);
    try {
      const files = await file_management.getUserFiles();
      setFileCount(files.length);
      
      const userNotes = await notes.getUserNotes();
      setNoteCount(userNotes.length);
      
      const photos = await photo_gallery.getUserPhotos();
      setPhotoCount(photos.length);
      
      const tasks = await task_manager.getUserTasks();
      setTaskCount(tasks.length);
      
      const expenses = await expense_tracker.getUserExpenses();
      setExpenseCount(expenses.length);
      
      const usage = await file_management.getUserStorageUsage();
      setStorageUsage(Number(usage));
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setCountsLoading(false);
    }
  };

  const updateUserData = async () => {
    const username = localStorage.getItem('username');
    if (username) {
      try {
        const result = await desuite_backend.getUser(username);
        if ('ok' in result) {
          setUser(result.ok);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
    updateUserData();
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'New Note':
        setActiveSection('notes');
        // Trigger new note creation in Notes component
        break;
      case 'Upload File':
        setActiveSection('files');
        // Trigger file upload in FileManagement component
        break;
      case 'Add Photo':
        setActiveSection('photos');
        // Trigger photo upload in PhotoGallery component
        break;
      case 'Create Task':
        setActiveSection('tasks');
        // Trigger new task creation in TaskManager component
        break;
      case 'Add Expense':
        setActiveSection('expenses');
        // Trigger new expense creation in ExpenseTracker component
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="space-y-4">
          <div className="h-12 w-48 bg-gray-800 animate-pulse rounded"></div>
          <div className="h-32 w-32 rounded-full bg-gray-800 animate-pulse mx-auto"></div>
          <div className="h-8 w-32 bg-gray-800 animate-pulse mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
          Please log in to view your dashboard.
        </div>
      </div>
    );
  }

  const navItems = [
    { icon: Home, label: 'Overview', section: 'overview' },
    { icon: Folder, label: 'Files', section: 'files' },
    { icon: FileText, label: 'Notes', section: 'notes' },
    { icon: Image, label: 'Photos', section: 'photos' },
    { icon: CheckCircle, label: 'Tasks', section: 'tasks' },
    { icon: CalendarIcon, label: 'Calendar', section: 'calendar' },
    { icon: DollarSign, label: 'Expenses', section: 'expenses' },
    { icon: ShieldCheck, label: 'Security', section: 'security' },
    { icon: SettingsIcon, label: 'Settings', section: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-yellow-500">Desuite</h1>
        </div>
        
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            {user.profilePicture && user.profilePicture.length > 0 ? (
              <img 
                src={URL.createObjectURL(profilePictureToBlob(user.profilePicture) || new Blob())}
                alt="Profile"
                className="h-16 w-16 rounded-full mx-auto object-cover border-2 border-yellow-500"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center border-2 border-yellow-500">
                <UserCircle className="h-10 w-10 text-yellow-500" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full"></span>
          </div>
          <h2 className="text-lg font-semibold mt-2">{user.firstName} {user.lastName}</h2>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map(({ icon: Icon, label, section }) => (
            <button
              key={section}
              className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeSection === section 
                  ? 'bg-yellow-500 text-black' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setActiveSection(section as typeof activeSection)}
            >
              <Icon className="h-5 w-5 mr-2" />
              {label}
            </button>
          ))}
        </nav>

        <button
          className="mt-auto w-full flex items-center px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
          onClick={handleLogoutClick}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {navItems.find(item => item.section === activeSection)?.label}
          </h1>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-yellow-500 rounded-full"></span>
          </button>
        </header>

        {notification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white p-2 rounded-lg shadow-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {notification}
          </div>
        )}

        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {countsLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-800 p-6 rounded-lg shadow-lg animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-4 w-24 bg-gray-700 rounded"></div>
                      <div className="h-5 w-5 bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-8 w-12 bg-gray-700 rounded"></div>
                  </div>
                ))
              ) : (
                <>
                  <MetricCard title="Files" value={fileCount} icon={Folder} />
                  <MetricCard title="Notes" value={noteCount} icon={FileText} />
                  <MetricCard title="Photos" value={photoCount} icon={Image} />
                  <MetricCard title="Tasks" value={taskCount} icon={CheckCircle} />
                  <MetricCard title="Expenses" value={expenseCount} icon={DollarSign} />
                </>
              )}
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Storage Usage</h2>
                <span className="text-sm text-gray-400">{(storageUsage / (1024 * 1024)).toFixed(2)} MB / 100 MB</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-500"
                  style={{ width: `${(storageUsage / (100 * 1024 * 1024)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start">
                      <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                        <FileText className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm">You added a new note</p>
                        <p className="text-xs text-gray-400">2 hours ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { icon: FileText, label: 'New Note' },
                    { icon: Folder, label: 'Upload File' },
                    { icon: Image, label: 'Add Photo' },
                    { icon: CheckCircle, label: 'Create Task' },
                    { icon: DollarSign, label: 'Add Expense' }
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      className="flex flex-col items-center justify-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      onClick={() => handleQuickAction(label)}
                    >
                      <Icon className="h-6 w-6 mb-2 text-yellow-500" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
                </div>
            </div>
          </div>
        )}

        {activeSection === 'files' && <FileManagement />}
        {activeSection === 'notes' && <Notes />}
        {activeSection === 'photos' && <PhotoGallery />}
        {activeSection === 'tasks' && <TaskManager />}
        {activeSection === 'calendar' && <Calendar />}
        {activeSection === 'expenses' && <ExpenseTracker />}
        {activeSection === 'security' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
            <p className="text-gray-400">Security settings will be implemented here.</p>
          </div>
        )}
        {activeSection === 'settings' && (
          <Settings 
            user={user} 
            showNotification={showNotification}
            onProfileUpdate={updateUserData}
          />
        )}
      </main>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        message="Are you sure you want to log out?"
      />
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: number;
  icon: React.FC<{ className?: string }>;
}> = ({ title, value, icon: Icon }) => (
  <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-sm font-medium text-gray-400">{title}</h3>
      <Icon className="h-5 w-5 text-yellow-500" />
    </div>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default Dashboard;