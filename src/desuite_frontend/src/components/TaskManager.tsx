import React, { useState, useEffect } from 'react';
import { task_manager } from '../../../declarations/task_manager';
import { Principal } from '@dfinity/principal';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  ClockIcon,
  TagIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Task {
  id: bigint;
  title: string;
  description: string;
  status: { todo: null } | { inProgress: null } | { done: null };
  dueDate: [] | [bigint];
  createdAt: bigint;
  updatedAt: bigint;
  owner: Principal;
}

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const fetchedTasks = await task_manager.getUserTasks();
      setTasks(fetchedTasks as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    
    try {
      let dueDate: [] | [bigint] = [];
      if (newTask.dueDate) {
        const dateValue = new Date(newTask.dueDate).getTime();
        if (!isNaN(dateValue)) {
          dueDate = [BigInt(dateValue * 1000000)];
        }
      }
      
      const result = await task_manager.createTask(newTask.title, newTask.description, dueDate);
      if ('ok' in result) {
        await fetchTasks();
        setNewTask({ title: '', description: '', dueDate: '' });
        setShowNewTaskForm(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    try {
      const result = await task_manager.updateTask(
        editingTask.id,
        editingTask.title,
        editingTask.description,
        editingTask.status,
        editingTask.dueDate
      );
      if ('ok' in result) {
        await fetchTasks();
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: bigint) => {
    try {
      const result = await task_manager.deleteTask(taskId);
      if ('ok' in result) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusString = (status: Task['status']): string => {
    if ('todo' in status) return 'todo';
    if ('inProgress' in status) return 'inProgress';
    if ('done' in status) return 'done';
    return 'unknown';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'todo': return 'bg-yellow-500';
      case 'inProgress': return 'bg-blue-500';
      case 'done': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return getStatusString(task.status) === filter;
  }).sort((a, b) => {
    if (a.dueDate.length > 0 && b.dueDate.length > 0) {
      return Number(a.dueDate[0]) - Number(b.dueDate[0]);
    }
    if (a.dueDate.length > 0) return -1;
    if (b.dueDate.length > 0) return 1;
    return Number(b.createdAt) - Number(a.createdAt);
  });

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-yellow-500 flex items-center">
          <CheckIcon className="h-8 w-8 mr-2 text-yellow-500" />
          Task Manager
        </h2>
        <button
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded inline-flex items-center transition duration-300"
        >
          {showNewTaskForm ? (
            <>
              <XMarkIcon className="h-5 w-5 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5 mr-2" />
              New Task
            </>
          )}
        </button>
      </header>

      {showNewTaskForm && (
        <div className="bg-gray-700 p-6 rounded-lg mb-8 shadow-lg transition-all duration-300">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full p-2 bg-gray-600 text-white rounded focus:ring-2 focus:ring-yellow-500 outline-none"
                placeholder="Enter task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full p-2 bg-gray-600 text-white rounded focus:ring-2 focus:ring-yellow-500 outline-none"
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full p-2 bg-gray-600 text-white rounded focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>
            <button
              onClick={handleCreateTask}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded transition duration-300"
            >
              Create Task
            </button>
          </div>
        </div>
      )}

      <div className="flex space-x-2 mb-6">
        {['all', 'todo', 'inProgress', 'done'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded transition duration-300 ${
              filter === filterOption
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {filterOption === 'all' ? 'All' :
             filterOption === 'todo' ? 'To Do' :
             filterOption === 'inProgress' ? 'In Progress' : 'Done'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <ArrowPathIcon className="h-8 w-8 text-yellow-500 animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <TagIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-400">No tasks found</p>
          <p className="text-gray-500">Create a new task to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id.toString()}
              className="bg-gray-700 p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{task.title}</h3>
                  <p className="text-gray-400 mb-4">{task.description}</p>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getStatusString(task.status))} text-black`}>
                      {getStatusString(task.status) === 'todo' ? 'To Do' :
                       getStatusString(task.status) === 'inProgress' ? 'In Progress' : 'Done'}
                    </span>
                    {task.dueDate.length > 0 && (
                      <span className="flex items-center text-gray-400 text-sm">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {new Date(Number(task.dueDate[0]) / 1000000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-2 text-blue-400 hover:bg-blue-400 hover:text-white rounded transition duration-300"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-red-400 hover:bg-red-400 hover:text-white rounded transition duration-300"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-yellow-500 mb-4">Edit Task</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-yellow-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-yellow-500 outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                <select
                  value={getStatusString(editingTask.status)}
                  onChange={(e) => setEditingTask({ ...editingTask, status: { [e.target.value]: null } as Task['status'] })}
                  className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-yellow-500 outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="inProgress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editingTask.dueDate.length > 0 ? new Date(Number(editingTask.dueDate[0]) / 1000000).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = new Date(e.target.value).getTime();
                    const newDueDate: [] | [bigint] = !isNaN(dateValue)
                      ? [BigInt(dateValue * 1000000)]
                      : [];
                    setEditingTask({ ...editingTask, dueDate: newDueDate });
                  }}
                  className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-yellow-500 outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTask}
                  className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 transition duration-300"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskManager