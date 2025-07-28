import React, { useState } from 'react';
import { Plus, CheckSquare, Square, Trash2, Edit3, AlertCircle, Clock, Zap, Flag } from 'lucide-react';
import { Task } from '../types';

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  showQuickAdd: boolean;
}

const TaskManager: React.FC<TaskManagerProps> = ({ 
  tasks, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask,
  showQuickAdd 
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    importance: 'medium' as Task['importance'],
    category: ''
  });

  const importanceConfig = {
    low: { 
      icon: Clock, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/20', 
      border: 'border-blue-500/30',
      label: 'Low Priority'
    },
    medium: { 
      icon: Flag, 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-500/20', 
      border: 'border-yellow-500/30',
      label: 'Medium Priority'
    },
    high: { 
      icon: Zap, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/20', 
      border: 'border-orange-500/30',
      label: 'High Priority'
    },
    urgent: { 
      icon: AlertCircle, 
      color: 'text-red-400', 
      bg: 'bg-red-500/20', 
      border: 'border-red-500/30',
      label: 'Urgent'
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.title.trim()) {
      onAddTask({
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        importance: newTask.importance,
        completed: false,
        category: newTask.category.trim()
      });
      setNewTask({ title: '', description: '', importance: 'medium', category: '' });
      setIsAddingTask(false);
    }
  };

  const handleToggleComplete = (task: Task) => {
    onUpdateTask(task.id, { 
      completed: !task.completed,
      completedAt: !task.completed ? new Date() : undefined
    });
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    const importanceOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Task Manager</h2>
          <p className="text-blue-200 text-sm">
            {completedCount} of {tasks.length} completed ({completionRate}%)
          </p>
        </div>
        
        {!showQuickAdd && (
          <button
            onClick={() => setIsAddingTask(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {tasks.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-blue-200 mb-2">
            <span>Progress</span>
            <span>{completionRate}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Task Form */}
      {(isAddingTask || showQuickAdd) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <input
            type="text"
            placeholder="Task title..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            autoFocus
          />
          
          {!showQuickAdd && (
            <>
              <textarea
                placeholder="Description (optional)..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3 resize-none"
                rows={2}
              />
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <select
                  value={newTask.importance}
                  onChange={(e) => setNewTask({ ...newTask, importance: e.target.value as Task['importance'] })}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Category (optional)"
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
          
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg py-2 font-medium transition-all duration-200 transform hover:scale-105"
            >
              Add Task
            </button>
            {!showQuickAdd && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTask({ title: '', description: '', importance: 'medium', category: '' });
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Tasks List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-blue-200">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tasks yet. Add one to get started!</p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const config = importanceConfig[task.importance];
            const Icon = config.icon;
            
            return (
              <div
                key={task.id}
                className={`
                  group p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                  ${task.completed 
                    ? 'bg-white/5 border-white/10 opacity-60' 
                    : `${config.bg} ${config.border}`
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className={`
                      flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 transform hover:scale-110
                      ${task.completed 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-white/30 hover:border-white/50'
                      }
                    `}
                  >
                    {task.completed && <CheckSquare className="w-4 h-4 text-white" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <h3 className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {task.title}
                      </h3>
                      {task.category && (
                        <span className="px-2 py-1 bg-white/10 text-blue-200 text-xs rounded-full">
                          {task.category}
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className={`text-sm ${task.completed ? 'text-gray-500' : 'text-blue-200'} mb-2`}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${config.color}`}>
                        {config.label}
                      </span>
                      
                      {task.completedAt && (
                        <span className="text-xs text-gray-400">
                          Completed {new Date(task.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 transform hover:scale-110"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TaskManager;