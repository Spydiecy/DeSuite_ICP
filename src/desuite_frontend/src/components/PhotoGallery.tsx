import React, { useState, useEffect } from 'react';
import { photo_gallery } from '../../../declarations/photo_gallery';
import { 
  CloudArrowUpIcon, 
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  FolderPlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

interface Photo {
  id: bigint;
  name: string;
  contentType: string;
  data: Uint8Array | number[];
  createdAt: bigint;
  size: bigint;
  albumId: [] | [bigint];
}

interface Album {
  id: bigint;
  name: string;
  createdAt: bigint;
}

const ITEMS_PER_PAGE = 12;
const MAX_STORAGE_PER_USER = 100 * 1024 * 1024; // 100 MB in bytes

const convertToBase64 = (data: Uint8Array | number[]): string => {
  const uint8Array = data instanceof Uint8Array ? data : new Uint8Array(data);
  return btoa(Array.from(uint8Array, byte => String.fromCharCode(byte)).join(''));
};

const PhotoGallery: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<bigint | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [storageUsage, setStorageUsage] = useState<bigint>(BigInt(0));
  const [newAlbumName, setNewAlbumName] = useState<string>('');
  const [showNewAlbumInput, setShowNewAlbumInput] = useState<boolean>(false);
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchPhotos();
    fetchAlbums();
    fetchStorageUsage();
  }, [currentAlbum]);

  const fetchPhotos = async () => {
    try {
      const fetchedPhotos = currentAlbum === null
        ? await photo_gallery.getUserPhotos()
        : await photo_gallery.getPhotosInAlbum(currentAlbum);
      
      const mappedPhotos: Photo[] = fetchedPhotos.map(photo => ({
        ...photo,
        data: Array.from(photo.data) // Ensure data is always an array
      }));
      
      setPhotos(mappedPhotos);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const fetchAlbums = async () => {
    try {
      const fetchedAlbums = await photo_gallery.getUserAlbums();
      setAlbums(fetchedAlbums);
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const fetchStorageUsage = async () => {
    try {
      const usage = await photo_gallery.getUserStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      console.error('Error fetching storage usage:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please select an image file.");
      return;
    }

    if (Number(storageUsage) + file.size > MAX_STORAGE_PER_USER) {
      alert("Storage limit exceeded. Please delete some photos before uploading more.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await photo_gallery.uploadPhoto(
        file.name, 
        file.type, 
        Array.from(new Uint8Array(arrayBuffer)),
        currentAlbum ? [currentAlbum] : []
      );
      if ('ok' in result) {
        await fetchPhotos();
        await fetchStorageUsage();
      } else {
        console.error('Error uploading photo:', result.err);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async (photoId: bigint) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      try {
        const result = await photo_gallery.deletePhoto(photoId);
        if ('ok' in result) {
          await fetchPhotos();
          await fetchStorageUsage();
        } else {
          console.error('Error deleting photo:', result.err);
        }
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
  };

  const handlePhotoDownload = (photo: Photo) => {
    const uint8Array = photo.data instanceof Uint8Array ? photo.data : new Uint8Array(photo.data);
    const blob = new Blob([uint8Array], { type: photo.contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = photo.name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;

    try {
      const result = await photo_gallery.createAlbum(newAlbumName);
      if ('ok' in result) {
        await fetchAlbums();
        setNewAlbumName('');
        setShowNewAlbumInput(false);
      } else {
        console.error('Error creating album:', result.err);
      }
    } catch (error) {
      console.error('Error creating album:', error);
    }
  };

  const handleDeleteAlbum = async (albumId: bigint) => {
    if (confirm('Are you sure you want to delete this album? All photos in the album will be moved to the main gallery.')) {
      try {
        const result = await photo_gallery.deleteAlbum(albumId);
        if ('ok' in result) {
          await fetchAlbums();
          if (currentAlbum === albumId) {
            setCurrentAlbum(null);
          }
          await fetchPhotos();
        } else {
          console.error('Error deleting album:', result.err);
        }
      } catch (error) {
        console.error('Error deleting album:', error);
      }
    }
  };

  const totalPages = Math.ceil(photos.length / ITEMS_PER_PAGE);
  const paginatedPhotos = photos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-yellow-500 flex items-center">
          <PhotoIcon className="h-8 w-8 mr-2" />
          My Photos
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedView('grid')}
            className={`p-2 rounded ${selectedView === 'grid' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSelectedView('list')}
            className={`p-2 rounded ${selectedView === 'list' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-white">Storage Usage: {(Number(storageUsage) / (1024 * 1024)).toFixed(2)} MB / 100 MB</p>
        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
          <div 
            className="bg-yellow-500 h-2.5 rounded-full" 
            style={{ width: `${(Number(storageUsage) / MAX_STORAGE_PER_USER) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <label htmlFor="photo-upload" className="cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded inline-flex items-center transition duration-300">
          <CloudArrowUpIcon className="h-5 w-5 mr-2" />
          {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
          disabled={uploadingPhoto}
        />
        
        <button
          onClick={() => setShowNewAlbumInput(!showNewAlbumInput)}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded inline-flex items-center transition duration-300"
        >
          <FolderPlusIcon className="h-5 w-5 mr-2" />
          New Album
        </button>
      </div>

      {showNewAlbumInput && (
        <div className="mb-4 flex space-x-2">
          <input
            type="text"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="Enter album name"
            className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
          />
          <button
            onClick={handleCreateAlbum}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Create
          </button>
        </div>
      )}

      <div className="flex mb-4 space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setCurrentAlbum(null)}
          className={`px-4 py-2 rounded-full ${
            currentAlbum === null
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          } transition duration-300`}
        >
          All Photos
        </button>
        {albums.map((album) => (
          <div key={album.id.toString()} className="relative group">
            <button
              onClick={() => setCurrentAlbum(album.id)}
              className={`px-4 py-2 rounded-full ${
                currentAlbum === album.id
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              } transition duration-300`}
            >
              {album.name}
            </button>
            <button
              onClick={() => handleDeleteAlbum(album.id)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition duration-300"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {selectedView === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedPhotos.map((photo) => (
            <div key={photo.id.toString()} className="relative group">
              <img
                src={`data:${photo.contentType};base64,${convertToBase64(photo.data)}`}
                alt={photo.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button
                  onClick={() => handlePhotoDownload(photo)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded transition duration-300 mr-2"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handlePhotoDelete(photo.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded transition duration-300"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedPhotos.map((photo) => (
            <div
              key={photo.id.toString()}
              className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition duration-300"
            >
              <div className="flex items-center">
                <img
                  src={`data:${photo.contentType};base64,${convertToBase64(photo.data)}`}
                  alt={photo.name}
                  className="h-12 w-12 object-cover rounded mr-4"
                />
                <div>
                  <p className="text-white font-medium">{photo.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(Number(photo.size) / 1024).toFixed(2)} KB • 
                    {new Date(Number(photo.createdAt) / 1000000).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePhotoDownload(photo)}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition duration-300"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handlePhotoDelete(photo.id)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition duration-300"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <p className="text-gray-400 text-center mt-4">No photos uploaded yet.</p>
      )}

      {photos.length > ITEMS_PER_PAGE && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50 transition duration-300"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Previous
          </button>
          <span className="text-white">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50 transition duration-300"
          >
            Next
            <ChevronRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;