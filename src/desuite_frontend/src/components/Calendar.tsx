import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { task_manager } from '../../../declarations/task_manager';
import { notes } from '../../../declarations/notes';
import { calendar_manager } from '../../../declarations/calendar_manager';
import { expense_tracker } from '../../../declarations/expense_tracker';
import { 
  CalendarIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import './calendar.css';

const localizer = momentLocalizer(moment);

interface ExtendedCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: 'task' | 'note' | 'meeting' | 'expense';
  description?: string;
  amount?: number;
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<ExtendedCalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ExtendedCalendarEvent | null>(null);
  const [isNewEvent, setIsNewEvent] = useState(true);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents(date, view);
  }, [date, view]);

  const fetchEvents = async (currentDate: Date, currentView: View) => {
    setIsLoading(true);
    try {
      let start: Date, end: Date;

      switch (currentView) {
        case 'month':
          start = moment(currentDate).startOf('month').toDate();
          end = moment(currentDate).endOf('month').toDate();
          break;
        case 'week':
          start = moment(currentDate).startOf('week').toDate();
          end = moment(currentDate).endOf('week').toDate();
          break;
        case 'day':
          start = moment(currentDate).startOf('day').toDate();
          end = moment(currentDate).endOf('day').toDate();
          break;
        default:
          start = moment(currentDate).startOf('day').toDate();
          end = moment(currentDate).endOf('day').toDate();
      }

      const tasks = await task_manager.getUserTasks();
      const userNotes = await notes.getUserNotes();
      const calendarEvents = await calendar_manager.getUserEvents();
      const expenses = await expense_tracker.getUserExpenses();

      const taskEvents: ExtendedCalendarEvent[] = tasks.map((task: any) => ({
        id: `task-${task.id.toString()}`,
        title: `Task: ${task.title}`,
        start: new Date(Number(task.createdAt) / 1000000),
        end: task.dueDate && task.dueDate.length > 0 
          ? new Date(Number(task.dueDate[0]) / 1000000) 
          : new Date(Number(task.createdAt) / 1000000),
        allDay: true,
        type: 'task',
        description: task.description,
      }));

      const noteEvents: ExtendedCalendarEvent[] = userNotes.map((note: any) => ({
        id: `note-${note.id.toString()}`,
        title: `Note: ${note.title}`,
        start: new Date(Number(note.createdAt) / 1000000),
        end: new Date(Number(note.createdAt) / 1000000),
        allDay: true,
        type: 'note',
        description: note.content,
      }));

      const meetingEvents: ExtendedCalendarEvent[] = calendarEvents.map((event: any) => ({
        id: `meeting-${event.id.toString()}`,
        title: event.title,
        start: new Date(Number(event.startTime) / 1000000),
        end: new Date(Number(event.endTime) / 1000000),
        allDay: event.isAllDay,
        type: 'meeting',
        description: event.description,
      }));

      const expenseEvents: ExtendedCalendarEvent[] = expenses.map((expense: any) => ({
        id: `expense-${expense.id.toString()}`,
        title: `Expense: ${expense.category}`,
        start: new Date(Number(expense.date) / 1000000),
        end: new Date(Number(expense.date) / 1000000),
        allDay: true,
        type: 'expense',
        description: expense.description,
        amount: expense.amount,
      }));

      const allEvents = [...taskEvents, ...noteEvents, ...meetingEvents, ...expenseEvents];
      const filteredEvents = allEvents.filter(event => 
        moment(event.start).isBetween(start, end, null, '[]') ||
        moment(event.end).isBetween(start, end, null, '[]')
      );

      setEvents(filteredEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setIsNewEvent(true);
    setSelectedEvent({
      id: '',
      title: '',
      start,
      end,
      allDay: false,
      type: 'meeting',
      description: '',
    });
    setShowEventModal(true);
  };

  const handleSelectEvent = (event: ExtendedCalendarEvent) => {
    setIsNewEvent(false);
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!selectedEvent) return;

    try {
      if (isNewEvent) {
        await calendar_manager.createEvent(
          selectedEvent.title,
          selectedEvent.description || '',
          BigInt(selectedEvent.start.getTime() * 1000000),
          BigInt(selectedEvent.end.getTime() * 1000000),
          selectedEvent.allDay || false
        );
      } else if (selectedEvent.type === 'meeting') {
        const eventId = BigInt(selectedEvent.id.split('-')[1]);
        await calendar_manager.updateEvent(
          eventId,
          selectedEvent.title,
          selectedEvent.description || '',
          BigInt(selectedEvent.start.getTime() * 1000000),
          BigInt(selectedEvent.end.getTime() * 1000000),
          selectedEvent.allDay || false
        );
      }
      await fetchEvents(date, view);
      setShowEventModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || selectedEvent.type !== 'meeting') return;

    try {
      const eventId = BigInt(selectedEvent.id.split('-')[1]);
      await calendar_manager.deleteEvent(eventId);
      await fetchEvents(date, view);
      setShowEventModal(false);
      setShowDeleteConfirmation(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const eventStyleGetter = (event: ExtendedCalendarEvent) => {
    let backgroundColor = '#4A5568';
    let color = '#ffffff';
    switch (event.type) {
      case 'task':
        backgroundColor = '#F6AD55';
        color = '#000000';
        break;
      case 'note':
        backgroundColor = '#68D391';
        color = '#000000';
        break;
      case 'meeting':
        backgroundColor = '#63B3ED';
        color = '#000000';
        break;
      case 'expense':
        backgroundColor = '#FC8181';
        color = '#000000';
        break;
    }
    return { 
      style: { 
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '4px',
        padding: '2px 5px',
      } 
    };
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <CalendarIcon className="h-8 w-8 mr-2" />
        Calendar
      </h2>
      <div className="mb-4 flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search events..."
          className="p-2 bg-gray-700 text-white rounded mr-2 flex-grow"
        />
        <select
          value={view}
          onChange={(e) => handleViewChange(e.target.value as View)}
          className="p-2 bg-gray-700 text-white rounded"
        >
          <option value="month">Month</option>
          <option value="week">Week</option>
          <option value="day">Day</option>
        </select>
      </div>
      <div className="calendar-container bg-gray-700 p-4 rounded-lg">
        <BigCalendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          eventPropGetter={eventStyleGetter}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          view={view}
          onView={handleViewChange}
          date={date}
          onNavigate={handleNavigate}
          className="text-white"
          dayPropGetter={() => ({ style: { backgroundColor: '#4B5563' } })}
          components={{
            toolbar: CustomToolbar,
          }}
        />
      </div>
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-yellow-500">
              {isNewEvent ? 'Add Event' : 'Event Details'}
            </h3>
            {selectedEvent.type === 'expense' ? (
              <>
                <p className="text-white mb-2"><strong>Type:</strong> Expense</p>
                <p className="text-white mb-2"><strong>Category:</strong> {selectedEvent.title.split(': ')[1]}</p>
                <p className="text-white mb-2"><strong>Amount:</strong> ${selectedEvent.amount?.toFixed(2)}</p>
                <p className="text-white mb-2"><strong>Description:</strong> {selectedEvent.description}</p>
                <p className="text-white mb-2"><strong>Date:</strong> {moment(selectedEvent.start).format('MMMM D, YYYY')}</p>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={selectedEvent.title}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                  placeholder="Event Title"
                  className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
                  readOnly={!isNewEvent && selectedEvent.type !== 'meeting'}
                />
                <textarea
                  value={selectedEvent.description}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                  placeholder="Event Description"
                  className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
                  readOnly={!isNewEvent && selectedEvent.type !== 'meeting'}
                />
                <input
                  type="datetime-local"
                  value={moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, start: new Date(e.target.value) })}
                  className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
                  readOnly={!isNewEvent && selectedEvent.type !== 'meeting'}
                />
                <input
                  type="datetime-local"
                  value={moment(selectedEvent.end).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, end: new Date(e.target.value) })}
                  className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
                  readOnly={!isNewEvent && selectedEvent.type !== 'meeting'}
                />
                {(isNewEvent || selectedEvent.type === 'meeting') && (
                  <label className="flex items-center mb-4 text-white">
                    <input
                      type="checkbox"
                      checked={selectedEvent.allDay || false}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, allDay: e.target.checked })}
                      className="mr-2"
                    />
                    All Day Event
                  </label>
                )}
              </>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setShowEventModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2"
              >
                Close
              </button>
              {(isNewEvent || selectedEvent.type === 'meeting') && (
                <>
                  {!isNewEvent && (
                    <button
                      onClick={() => setShowDeleteConfirmation(true)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mr-2"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={handleSaveEvent}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded"
                  >
                    {isNewEvent ? 'Add' : 'Update'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-yellow-500">Confirm Delete</h3>
            <p className="text-white mb-4">Are you sure you want to delete this event?</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomToolbar: React.FC<any> = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const label = () => {
    const date = moment(toolbar.date);
    return (
      <span className="text-lg font-semibold">{date.format('MMMM YYYY')}</span>
    );
  };

  return (
    <div className="flex justify-between items-center mb-4 text-white">
      <div>
        <button
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
          onClick={goToBack}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <button
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
          onClick={goToNext}
        >
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>
      <div>{label()}</div>
      <button
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded"
        onClick={goToCurrent}
      >
        Today
      </button>
    </div>
  );
};

export default Calendar;