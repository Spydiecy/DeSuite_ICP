import React, { useState, useEffect, useRef } from 'react';
import { expense_tracker } from '../../../declarations/expense_tracker';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  TagIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartPieIcon,
  ArrowPathIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

interface Expense {
  id: bigint;
  amount: number;
  category: string;
  description: string;
  date: bigint;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ExpenseTracker: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: '',
    date: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const userExpenses = await expense_tracker.getUserExpenses();
      setExpenses(userExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.category || !newExpense.date) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      const result = await expense_tracker.addExpense(
        parseFloat(newExpense.amount),
        newExpense.category,
        newExpense.description,
        BigInt(new Date(newExpense.date).getTime())
      );
      if ('ok' in result) {
        await fetchExpenses();
        setShowModal(false);
        setNewExpense({ amount: '', category: '', description: '', date: '' });
      } else {
        console.error('Error adding expense:', result.err);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    try {
      const result = await expense_tracker.updateExpense(
        editingExpense.id,
        parseFloat(newExpense.amount),
        newExpense.category,
        newExpense.description,
        BigInt(new Date(newExpense.date).getTime())
      );
      if ('ok' in result) {
        await fetchExpenses();
        setShowModal(false);
        setEditingExpense(null);
        setNewExpense({ amount: '', category: '', description: '', date: '' });
      } else {
        console.error('Error updating expense:', result.err);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: bigint) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const result = await expense_tracker.deleteExpense(expenseId);
      if ('ok' in result) {
        await fetchExpenses();
      } else {
        console.error('Error deleting expense:', result.err);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n').map(line => line.trim()).filter(line => line);
      try {
        const result = await expense_tracker.importExpensesFromCSV(lines);
        if ('ok' in result) {
          alert(`Successfully imported ${result.ok} expenses.`);
          await fetchExpenses();
        } else {
          console.error('Error importing expenses:', result.err);
        }
      } catch (error) {
        console.error('Error importing expenses:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = await expense_tracker.exportExpensesToCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'expenses.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting expenses:', error);
    }
  };

  const prepareChartData = () => {
    const filteredExpenses = filterExpenses(expenses);
    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total,
    }));
  };

  const filterExpenses = (expensesToFilter: Expense[]) => {
    return expensesToFilter.filter(expense => {
      const expenseDate = new Date(Number(expense.date));
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      
      return (
        (filter === 'all' || expense.category.toLowerCase() === filter) &&
        (!startDate || expenseDate >= startDate) &&
        (!endDate || expenseDate <= endDate)
      );
    });
  };

  const chartData = prepareChartData();
  const filteredExpenses = filterExpenses(expenses);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-yellow-500 flex items-center">
          <ChartPieIcon className="h-8 w-8 mr-2" />
          Expense Tracker
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded inline-flex items-center transition duration-300"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Expense
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center transition duration-300"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Import CSV
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCSV}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={handleExportCSV}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center transition duration-300"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Category Filter</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-yellow-500 outline-none"
          >
            <option value="all">All Categories</option>
            {Array.from(new Set(expenses.map(e => e.category))).map(cat => (
              <option key={cat} value={cat.toLowerCase()}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-yellow-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-yellow-500 outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <ArrowPathIcon className="h-8 w-8 text-yellow-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-yellow-500">Expense by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-yellow-500">Expense Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4 text-yellow-500">Total Expenses</h3>
            <p className="text-3xl font-bold text-white">${totalExpenses.toFixed(2)}</p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-yellow-500">Recent Expenses</h3>
            {filteredExpenses.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No expenses found for the selected criteria.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="py-2">Date</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Description</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id.toString()} className="border-b border-gray-600">
                        <td className="py-2">{new Date(Number(expense.date)).toLocaleDateString()}</td>
                        <td className="py-2">{expense.category}</td>
                        <td className="py-2">{expense.description}</td>
                        <td className="py-2">${expense.amount.toFixed(2)}</td>
                        <td className="py-2">
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setNewExpense({
                                amount: expense.amount.toString(),
                                category: expense.category,
                                description: expense.description,
                                date: new Date(Number(expense.date)).toISOString().split('T')[0],
                              });
                              setShowModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-600 mr-2"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-yellow-500">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Amount</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Category</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <TagIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="e.g., Food, Transport"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Description</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="Expense description"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Date</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingExpense(null);
                  setNewExpense({ amount: '', category: '', description: '', date: '' });
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded transition duration-300"
              >
                {editingExpense ? 'Update' : 'Add'} Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTracker;