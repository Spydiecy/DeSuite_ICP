import React, { useState, useEffect } from 'react';
import { file_management } from '../../../declarations/file_management';
import { 
  CloudArrowUpIcon, 
  ArrowDownTrayIcon, 
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentIcon,
  ExclamationCircleIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

interface File {
  id: bigint;
  name: string;
  contentType: string;
  size: bigint;
  createdAt: bigint;
}

const ITEMS_PER_PAGE = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_STORAGE = 100 * 1024 * 1024; // 100 MB

const FileManagement: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [storageUsage, setStorageUsage] = useState<bigint>(BigInt(0));
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchFiles();
    fetchStorageUsage();
  }, []);

  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fileIds = await file_management.getUserFiles();
      const filePromises = fileIds.map(id => file_management.getFile(id));
      const fileResults = await Promise.all(filePromises);
      const fetchedFiles = fileResults
        .filter(result => 'ok' in result)
        .map(result => (result as any).ok)
        .sort((a, b) => Number(b.createdAt - a.createdAt));
      setFiles(fetchedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to fetch files. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStorageUsage = async () => {
    try {
      const usage = await file_management.getUserStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      console.error('Error fetching storage usage:', error);
    }
  };

  const handleFileUpload = async (file: globalThis.File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
      return;
    }

    if (Number(storageUsage) + file.size > MAX_STORAGE) {
      setError(`Uploading this file would exceed your storage quota of ${MAX_STORAGE / (1024 * 1024)} MB`);
      return;
    }

    setUploadingFile(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await file_management.uploadFile(file.name, file.type, Array.from(new Uint8Array(arrayBuffer)));
      if ('ok' in result) {
        await fetchFiles();
        await fetchStorageUsage();
      } else {
        setError(`Error uploading file: ${result.err}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again later.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileDelete = async (fileId: bigint) => {
    setError(null);
    try {
      const result = await file_management.deleteFile(fileId);
      if ('ok' in result) {
        await fetchFiles();
        await fetchStorageUsage();
      } else {
        setError(`Error deleting file: ${result.err}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file. Please try again later.');
    }
  };

  const handleFileDownload = async (fileId: bigint, fileName: string, contentType: string) => {
    setError(null);
    try {
      const result = await file_management.downloadFile(fileId);
      if ('ok' in result) {
        const blob = new Blob([new Uint8Array(result.ok)], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError(`Error downloading file: ${result.err}`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file. Please try again later.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      await handleFileUpload(file);
    }
  };

  const totalPages = Math.ceil(files.length / ITEMS_PER_PAGE);
  const paginatedFiles = files.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex justify-center items-center h-[600px]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-yellow-500 flex items-center">
        <FolderIcon className="h-8 w-8 mr-2 text-yellow-500" />
        My Files
      </h2>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-4 flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="mb-4">
        <div className="w-full bg-gray-700 rounded-lg h-2.5 mb-2">
          <div 
            className="bg-yellow-500 h-2.5 rounded-lg transition-all duration-300"
            style={{ width: `${(Number(storageUsage) / Number(MAX_STORAGE)) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-400">
          Storage used: {(Number(storageUsage) / (1024 * 1024)).toFixed(2)} MB of {MAX_STORAGE / (1024 * 1024)} MB
        </p>
      </div>

      <div 
        className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${
          dragOver ? 'border-yellow-500 bg-gray-700' : 'border-gray-600 hover:border-yellow-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label htmlFor="file-upload" className="cursor-pointer">
          <CloudArrowUpIcon className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
          <span className="text-white font-medium">
            Drag and drop files here, or click to select files
          </span>
          <p className="text-sm text-gray-400 mt-1">
            Maximum file size: {MAX_FILE_SIZE / (1024 * 1024)} MB
          </p>
        </label>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
          disabled={uploadingFile}
        />
      </div>

      {uploadingFile && (
        <div className="mb-4 flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-500 mr-2"></div>
          <span className="text-white">Uploading file...</span>
        </div>
      )}

      <ul className="space-y-2">
        {paginatedFiles.map((file) => (
          <li key={file.id.toString()} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors duration-300">
            <div className="flex items-center flex-1 min-w-0">
              <DocumentIcon className="h-6 w-6 mr-3 text-yellow-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{file.name}</p>
                <p className="text-sm text-gray-400 truncate">
                  {(Number(file.size) / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 space-x-2">
              <button
                className="p-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 transition-colors"
                onClick={() => handleFileDownload(file.id, file.name, file.contentType)}
              >
                <ArrowDownTrayIcon className="h-5 w-5 text-gray-900" />
              </button>
              <button
                className="p-2 rounded-lg bg-red-500 hover:bg-red-400 transition-colors"
                onClick={() => handleFileDelete(file.id)}
              >
                <TrashIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {files.length > ITEMS_PER_PAGE && (
        <div className="flex justify-between items-center mt-6">
          <button
            className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-white"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Previous
          </button>
          <span className="text-white">Page {currentPage} of {totalPages}</span>
          <button
            className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-white"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRightIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileManagement;
