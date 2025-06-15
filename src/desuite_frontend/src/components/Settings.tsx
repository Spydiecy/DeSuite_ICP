import React, { useState } from 'react';
import { User } from '../../../declarations/desuite_backend/desuite_backend.did';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

interface SettingsProps {
  user: User;
  showNotification: (message: string) => void;
  onProfileUpdate: () => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ user, showNotification }) => {
  const [profileData, setProfileData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await desuite_backend.updateUser(
        user.username,
        profileData.firstName,
        profileData.lastName,
        profileData.email
      );
      if ('ok' in result) {
        showNotification('Profile updated successfully');
      } else {
        showNotification(`Error updating profile: ${result.err}`);
      }
    } catch (error) {
      showNotification(`Error updating profile: ${error}`);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('New passwords do not match');
      return;
    }
    try {
      const result = await desuite_backend.changePassword(
        user.username,
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if ('ok' in result) {
        showNotification('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showNotification(`Error changing password: ${result.err}`);
      }
    } catch (error) {
      showNotification(`Error changing password: ${error}`);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePicture) return;

    try {
      const arrayBuffer = await profilePicture.arrayBuffer();
      const result = await desuite_backend.uploadProfilePicture(user.username, Array.from(new Uint8Array(arrayBuffer)));
      if ('ok' in result) {
        showNotification('Profile picture uploaded successfully');
      } else {
        showNotification(`Error uploading profile picture: ${result.err}`);
      }
    } catch (error) {
      showNotification(`Error uploading profile picture: ${error}`);
    }
  };

  const profilePictureToBlob = (profilePicture: [] | [Uint8Array | number[]]): Blob | null => {
    if (profilePicture.length === 0) return null;
    const data = profilePicture[0];
    return new Blob([data instanceof Uint8Array ? data : new Uint8Array(data)], { type: 'image/jpeg' });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-yellow-500">Account Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 text-yellow-500">Update Profile</h3>
          <form onSubmit={handleProfileUpdate}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                className="w-full p-2 bg-gray-700 text-white rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                className="w-full p-2 bg-gray-700 text-white rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full p-2 bg-gray-700 text-white rounded"
              />
            </div>
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded"
            >
              Update Profile
            </button>
          </form>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-yellow-500">Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full p-2 bg-gray-700 text-white rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full p-2 bg-gray-700 text-white rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full p-2 bg-gray-700 text-white rounded"
              />
            </div>
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded"
            >
              Change Password
            </button>
          </form>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2 text-yellow-500">Profile Picture</h3>
        <div className="flex items-center space-x-4">
          {user.profilePicture ? (
            <img 
              src={URL.createObjectURL(profilePictureToBlob(user.profilePicture) || new Blob())} 
              alt="Profile" 
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <UserCircleIcon className="h-24 w-24 text-yellow-500" />
          )}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
              id="profile-picture-input"
            />
            <label
              htmlFor="profile-picture-input"
              className="cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded transition duration-300 flex items-center justify-center mb-2"
            >
              <CameraIcon className="h-5 w-5 mr-2" />
              Choose New Picture
            </label>
            {profilePicture && (
              <button
                onClick={handleProfilePictureUpload}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Upload Picture
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;