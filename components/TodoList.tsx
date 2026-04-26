"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";

type Todo = {
  id: string;
  name: string;
  completed?: boolean;
};

interface TodoListProps {
  initialTodos: Todo[];
}

export function TodoList({ initialTodos }: TodoListProps) {
  const [todos, setTodos] = useState(initialTodos || []);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = todos.length - completedCount;

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {todos.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Ativas</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {activeCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Concluídas</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {completedCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "active", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 ${
              filter === tab
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {tab === "all" && "Todas"}
            {tab === "active" && "Ativas"}
            {tab === "completed" && "Concluídas"}
          </button>
        ))}
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        {filteredTodos.length > 0 ? (
          filteredTodos.map((todo, index) => (
            <div
              key={todo.id}
              style={{
                animation: `fadeIn 0.4s ease-out ${index * 0.05}s both`,
              }}
              className="group glass rounded-xl p-4 hover-lift border-l-4 border-l-blue-500 hover:border-l-blue-600"
            >
              <div className="flex items-center gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className="flex-shrink-0 transition-all transform hover:scale-110 active:scale-95"
                >
                  {todo.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 animate-popIn" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 hover:text-blue-500 transition-colors" />
                  )}
                </button>

                {/* Todo Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-base font-medium break-words transition-all ${
                      todo.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {todo.name}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 animate-fadeIn">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-gray-500 font-medium">
              {filter === "completed" && "Nenhuma tarefa concluída ainda"}
              {filter === "active" && "Sem tarefas ativas"}
              {filter === "all" && "Nenhuma tarefa criada"}
            </p>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {todos.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">
                <strong>{((completedCount / todos.length) * 100).toFixed(0)}%</strong> de
                progresso
              </span>
            </div>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                style={{
                  width: `${(completedCount / todos.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
