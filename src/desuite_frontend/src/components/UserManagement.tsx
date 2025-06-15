import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { User } from '../../../declarations/desuite_backend/desuite_backend.did';
import { Toaster, toast } from 'react-hot-toast';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserCircleIcon, 
  KeyIcon,
  UserPlusIcon,
  IdentificationIcon,
  AtSymbolIcon,
  CameraIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

type Result<T> = { ok: T } | { err: string };

function UserManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loginData, setLoginData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      fetchUser(username);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (isLogin) {
      setLoginData({ ...loginData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const registerPromise = desuite_backend.registerUser(
      formData.username,
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.password
    );

    toast.promise(
      registerPromise,
      {
        loading: 'Creating your account...',
        success: (result) => {
          if ('ok' in result) {
            fetchUser(formData.username);
            localStorage.setItem('username', formData.username);
            navigate('/dashboard');
            return 'Welcome aboard! Your account has been created.';
          } else {
            throw new Error(result.err);
          }
        },
        error: (err) => `Oops! ${err.message}`
      },
      {
        style: {
          minWidth: '250px',
          backgroundColor: '#1f2937',
          color: '#fff',
        },
        success: {
          duration: 5000,
          icon: '🎉',
        },
        error: {
          duration: 5000,
          icon: '❌',
        },
      }
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginPromise = desuite_backend.login(loginData.usernameOrEmail, loginData.password);

    toast.promise(
      loginPromise,
      {
        loading: 'Logging you in...',
        success: (result) => {
          if ('ok' in result) {
            setUser(result.ok);
            setLoginData({ usernameOrEmail: '', password: '' });
            localStorage.setItem('username', result.ok.username);
            navigate('/dashboard');
            return `Welcome back, ${result.ok.firstName}!`;
          } else {
            throw new Error(result.err);
          }
        },
        error: (err) => `Login failed: ${err.message}`
      },
      {
        style: {
          minWidth: '250px',
          backgroundColor: '#1f2937',
          color: '#fff',
        },
        success: {
          duration: 5000,
          icon: '👋',
        },
        error: {
          duration: 5000,
          icon: '🔐',
        },
      }
    );
  };

  const fetchUser = async (username: string) => {
    try {
      const result = await desuite_backend.getUser(username);
      if ('ok' in result) {
        setUser(result.ok);
      } else {
        toast.error('User not found', { 
          icon: '🕵️',
          style: {
            backgroundColor: '#1f2937',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`, { 
        icon: '⚠️',
        style: {
          backgroundColor: '#1f2937',
          color: '#fff',
        },
      });
    }
  };

  const handleLogout = () => {
    setUser(null);
    toast.success('Logged out successfully. See you soon!', {
      icon: '👋',
      duration: 3000,
      style: {
        backgroundColor: '#1f2937',
        color: '#fff',
      },
    });
    setFormData({ username: '', firstName: '', lastName: '', email: '', password: '' });
    setLoginData({ usernameOrEmail: '', password: '' });
    localStorage.removeItem('username');
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
      toast('Great choice! Click "Upload Picture" to save it.', {
        icon: '📸',
        duration: 3000,
        style: {
          backgroundColor: '#1f2937',
          color: '#fff',
        },
      });
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!user || !profilePicture) return;

    const uploadPromise = async () => {
      const arrayBuffer = await profilePicture.arrayBuffer();
      return desuite_backend.uploadProfilePicture(user.username, Array.from(new Uint8Array(arrayBuffer)));
    };

    toast.promise(
      uploadPromise(),
      {
        loading: 'Uploading your awesome pic...',
        success: (result) => {
          if ('ok' in result) {
            fetchUser(user.username);
            return 'Looking good! Profile picture updated.';
          } else {
            throw new Error(result.err);
          }
        },
        error: 'Oops! Failed to upload the picture.'
      },
      {
        style: {
          minWidth: '250px',
          backgroundColor: '#1f2937',
          color: '#fff',
        },
        success: {
          duration: 5000,
          icon: '🌟',
        },
        error: {
          duration: 5000,
          icon: '📷❌',
        },
      }
    );
  };

  const profilePictureToBlob = (profilePicture: [] | [Uint8Array | number[]]): Blob | null => {
    if (profilePicture.length === 0) return null;
    const data = profilePicture[0];
    return new Blob([data instanceof Uint8Array ? data : new Uint8Array(data)], { type: 'image/jpeg' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900 p-4">
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          className: 'bg-gray-800 text-white',
        }}
      />
      <div className="bg-black bg-opacity-50 p-8 rounded-lg shadow-2xl w-full max-w-md backdrop-filter backdrop-blur-sm border border-gray-800 transition-all duration-300 hover:shadow-yellow-500/20">
        <div className="flex items-center justify-center mb-8 animate-pulse">
          <KeyIcon className="h-12 w-12 text-yellow-500 mr-2" />
          <h1 className="text-4xl font-bold text-center text-yellow-500">desuite</h1>
        </div>
        {user ? (
          <div className="text-center text-white space-y-6">
            <div className="relative inline-block">
              {user.profilePicture ? (
                <img 
                  src={URL.createObjectURL(profilePictureToBlob(user.profilePicture) || new Blob())} 
                  alt="Profile" 
                  className="h-32 w-32 rounded-full mx-auto object-cover border-4 border-yellow-500 transition-all duration-300 hover:scale-105"
                />
              ) : (
                <UserCircleIcon className="h-32 w-32 text-yellow-500 mx-auto transition-all duration-300 hover:scale-105" />
              )}
              <div className="absolute bottom-0 right-0 bg-yellow-500 rounded-full p-2 cursor-pointer transition-all duration-300 hover:bg-yellow-600">
                <label htmlFor="profile-picture-input" className="cursor-pointer">
                  <CameraIcon className="h-6 w-6 text-black" />
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                  id="profile-picture-input"
                />
              </div>
            </div>
            <h2 className="text-3xl font-semibold mb-4 text-yellow-500">Welcome, {user.firstName}!</h2>
            <p className="mb-2 flex items-center justify-center text-lg">
              <UserIcon className="h-5 w-5 mr-2 text-yellow-500" />
              {user.username}
            </p>
            <p className="mb-4 flex items-center justify-center text-lg">
              <EnvelopeIcon className="h-5 w-5 mr-2 text-yellow-500" />
              {user.email}
            </p>
            {profilePicture && (
              <button
                onClick={handleProfilePictureUpload}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Upload Picture
              </button>
            )}
            <button
              onClick={handleLogout}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center justify-center mx-auto"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setIsLogin(false)}
                className={`px-6 py-2 rounded-l-full transition duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 ${!isLogin ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                Register
              </button>
              <button
                onClick={() => setIsLogin(true)}
                className={`px-6 py-2 rounded-r-full transition duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 ${isLogin ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                Login
              </button>
            </div>
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative mb-4">
                  <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-300 mb-1">Username or Email</label>
                  <div className="relative">
                    <AtSymbolIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      id="usernameOrEmail"
                      name="usernameOrEmail"
                      placeholder="Enter your username or email"
                      value={loginData.usernameOrEmail}
                      onChange={handleInputChange}
                      className="w-full p-3 pl-10 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <div className="relative mb-4">
                  <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                  <div className="relative">
                    <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="password"
                      id="loginPassword"
                      name="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={handleInputChange}
                      className="w-full p-3 pl-10 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-full transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 flex items-center justify-center"
                >
                  <UserCircleIcon className="h-5 w-5 mr-2" />
                  Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative mb-4">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                  <div className="relative">
                    <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full p-3 pl-10 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <div className="relative mb-4">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                  <div className="relative">
                    <IdentificationIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full p-3 pl-10 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <div className="relative mb-4">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                  <div className="relative">
                    <IdentificationIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full p-3 pl-10 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <div className="relative mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <div className="relative">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-3 pl-10 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <div className="relative mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                  <div className="relative">
                    <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Choose a strong password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full p-3 pl-10 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-full transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 flex items-center justify-center"
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Register
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UserManagement;