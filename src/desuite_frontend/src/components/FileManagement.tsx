import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { file_management } from '../../../declarations/file_management';
import { 
  CloudArrowUpIcon, 
  ArrowDownTrayIcon, 
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentIcon,
  ExclamationCircleIcon,
  FolderIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface File {
  id: bigint;
  name: string;
  contentType: string;
  size: bigint;
  createdAt: bigint;
}

interface PendingUpload {
  file: globalThis.File;
  size: number;
  isValid: boolean;
  errorMessage: string | null;  // Changed from string | undefined to string | null
}

const ITEMS_PER_PAGE = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_STORAGE = 100 * 1024 * 1024; // 100 MB
const WORD_FILE_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/html',
  'text/doc',
  'application/doc'
];

const FileManagement: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [storageUsage, setStorageUsage] = useState<bigint>(BigInt(0));
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);

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

  const validateFileSize = (file: globalThis.File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2);
      return `This file is too big to be uploaded (${fileSizeMB}MB/${maxSizeMB}MB)`;
    }
    if (Number(storageUsage) + file.size > MAX_STORAGE) {
      const remainingStorage = (MAX_STORAGE - Number(storageUsage)) / (1024 * 1024);
      return `Not enough storage space. Only ${remainingStorage.toFixed(2)}MB available`;
    }
    return null;
  };

  const handleFileSelect = (file: globalThis.File) => {
    const errorMessage = validateFileSize(file);
    setPendingUpload({
      file,
      size: file.size,
      isValid: !errorMessage,
      errorMessage
    });
  };

  const confirmUpload = async () => {
    if (!pendingUpload || !pendingUpload.isValid || uploadingFile) return;
    
    setUploadingFile(true);
    setError(null);
    try {
      const arrayBuffer = await pendingUpload.file.arrayBuffer();
      const result = await file_management.uploadFile(
        pendingUpload.file.name,
        pendingUpload.file.type,
        Array.from(new Uint8Array(arrayBuffer))
      );
      if ('ok' in result) {
        await Promise.all([fetchFiles(), fetchStorageUsage()]);
        setPendingUpload(null);
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

  const cancelUpload = () => {
    setPendingUpload(null);
    setError(null);
  };

  const handleFileDelete = async (fileId: bigint) => {
    setError(null);
    try {
      const result = await file_management.deleteFile(fileId);
      if ('ok' in result) {
        await Promise.all([fetchFiles(), fetchStorageUsage()]);
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
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError(`Error downloading file: ${result.err}`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file. Please try again later.');
    }
  };

  const openInWordEditor = async (fileId: bigint, fileName: string) => {
    try {
      const result = await file_management.downloadFile(fileId);
      if ('ok' in result) {
        const content = new TextDecoder().decode(new Uint8Array(result.ok));
        sessionStorage.setItem('wordEditorContent', content);
        sessionStorage.setItem('wordEditorFileName', fileName);
        navigate('/word-editor');
      } else {
        setError(`Error opening file: ${result.err}`);
      }
    } catch (error) {
      console.error('Error opening file in editor:', error);
      setError('Failed to open file in editor. Please try again later.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
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
          <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="mb-4">
        <div className="w-full bg-gray-700 rounded-lg h-2.5 mb-2">
          <div 
            className="bg-yellow-500 h-2.5 rounded-lg transition-all duration-300"
            style={{ width: `${(Number(storageUsage) / Number(MAX_STORAGE)) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-400">
          Storage used: {(Number(storageUsage) / (1024 * 1024)).toFixed(2)} MB of {MAX_STORAGE / (1024 * 1024)} MB
        </p>
      </div>

      {!pendingUpload ? (
        <div 
          className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${
            dragOver ? 'border-yellow-500 bg-gray-700' : 'border-gray-600 hover:border-yellow-500'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onDrop={handleDrop}
        >
          <label htmlFor="file-upload" className="cursor-pointer block">
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
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            disabled={uploadingFile}
          />
        </div>
      ) : (
        <div className="mb-6 bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <DocumentIcon className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-white font-medium truncate max-w-md">{pendingUpload.file.name}</p>
                <p className="text-sm text-gray-400">
                  {(pendingUpload.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={confirmUpload}
                disabled={!pendingUpload.isValid || uploadingFile}
                className={`p-2 rounded-lg ${
                  pendingUpload.isValid && !uploadingFile
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-600 cursor-not-allowed'
                } transition-colors`}
                title={pendingUpload.isValid ? 'Confirm Upload' : 'Upload not allowed'}
              >
                <CheckIcon className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={cancelUpload}
                disabled={uploadingFile}
                className="p-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                title="Cancel Upload"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          {pendingUpload.errorMessage && (
            <div className="text-red-400 text-sm mt-2">{pendingUpload.errorMessage}</div>
          )}
          {uploadingFile && (
            <div className="flex items-center mt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-yellow-500 mr-2" />
              <span className="text-white text-sm">Uploading file...</span>
            </div>
          )}
        </div>
      )}

      <ul className="space-y-2">
        {paginatedFiles.map((file) => (
          <li 
            key={file.id.toString()} 
            className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors duration-300"
          >
            <div className="flex items-center flex-1 min-w-0">
              <DocumentIcon className="h-6 w-6 mr-3 text-yellow-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {(Number(file.size) / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center space-x-2">
              {WORD_FILE_TYPES.includes(file.contentType) && (
                <button
                  onClick={() => openInWordEditor(file.id, file.name)}
                  className="p-2 rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors"
                  title="Open in Editor"
                >
                  <PencilSquareIcon className="h-5 w-5 text-white" />
                </button>
              )}
              <button
                onClick={() => handleFileDownload(file.id, file.name, file.contentType)}
                className="p-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 transition-colors"
                title="Download"
              >
                <ArrowDownTrayIcon className="h-5 w-5 text-gray-900" />
              </button>
              <button
                onClick={() => handleFileDelete(file.id)}
                className="p-2 rounded-lg bg-red-500 hover:bg-red-400 transition-colors"
                title="Delete"
              >
                <TrashIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {files.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <DocumentIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No files uploaded yet</p>
        </div>
      )}

      {files.length > ITEMS_PER_PAGE && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Previous
          </button>
          <span className="text-white">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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