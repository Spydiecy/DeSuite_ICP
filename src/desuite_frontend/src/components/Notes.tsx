import React, { useState, useEffect } from 'react';
import { notes } from '../../../declarations/notes';
import { 
  PencilIcon, 
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  PlusIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface Note {
  id: bigint;
  title: string;
  content: string;
  createdAt: bigint;
  updatedAt: bigint;
}

const ITEMS_PER_PAGE = 5;

const Notes: React.FC = () => {
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedNotes = await notes.getUserNotes();
      setUserNotes(fetchedNotes.sort((a, b) => Number(b.updatedAt - a.updatedAt)));
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to fetch notes. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = () => {
    setModalMode('create');
    setNoteTitle('');
    setNoteContent('');
    setCurrentNote(null);
    setIsModalOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setModalMode('edit');
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setCurrentNote(note);
    setIsModalOpen(true);
  };

  const handleDeleteNote = async (noteId: bigint) => {
    setError(null);
    try {
      const result = await notes.deleteNote(noteId);
      if ('ok' in result) {
        await fetchNotes();
      } else {
        setError(`Error deleting note: ${result.err}`);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note. Please try again later.');
    }
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      setError('Note title and content cannot be empty.');
      return;
    }

    setError(null);
    try {
      if (modalMode === 'create') {
        const result = await notes.createNote(noteTitle, noteContent);
        if ('ok' in result) {
          await fetchNotes();
          setIsModalOpen(false);
        } else {
          setError(`Error creating note: ${result.err}`);
        }
      } else {
        if (currentNote) {
          const result = await notes.updateNote(currentNote.id, noteTitle, noteContent);
          if ('ok' in result) {
            await fetchNotes();
            setIsModalOpen(false);
          } else {
            setError(`Error updating note: ${result.err}`);
          }
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setError('Failed to save note. Please try again later.');
    }
  };

  const totalPages = Math.ceil(userNotes.length / ITEMS_PER_PAGE);
  const paginatedNotes = userNotes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
        <DocumentTextIcon className="h-8 w-8 mr-2 text-yellow-500" />
        My Notes
      </h2>
      
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-4 flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={handleCreateNote}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded inline-flex items-center transition duration-300"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Note
        </button>
      </div>

      <ul className="space-y-2">
        {paginatedNotes.map((note) => (
          <li key={note.id.toString()} className="bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-white">{note.title}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditNote(note)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded transition duration-300"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded transition duration-300"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
            <p className="text-gray-400 text-sm mt-2">
              Last updated: {new Date(Number(note.updatedAt)).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>

      {userNotes.length === 0 && (
        <p className="text-gray-400 text-center mt-4">No notes created yet.</p>
      )}

      {userNotes.length > ITEMS_PER_PAGE && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded disabled:opacity-50 transition duration-300"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="text-white">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded disabled:opacity-50 transition duration-300"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4 text-yellow-500">
              {modalMode === 'create' ? 'Create New Note' : 'Edit Note'}
            </h3>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note Title"
              className="w-full p-2 mb-4 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Note Content"
              rows={6}
              className="w-full p-2 mb-4 bg-gray-700 text-white rounded resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded transition duration-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;