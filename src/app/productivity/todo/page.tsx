"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { TaskProvider } from "@/contexts/TaskContext";
import TodoList from "@/components/productivity/todo/TodoList";
import BackToHome from "@/components/common/BackToHome";

const TodoPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"short-term" | "long-term">(
    "short-term"
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TaskProvider>
      <div className="p-6 flex justify-center">
        <div className="w-full max-w-6xl">
          {/* Back to Home button */}
          <div className="mb-4">
            <BackToHome />
          </div>

          <div className="transition-shadow duration-300 border shadow-md bg-card rounded-xl hover:shadow-lg border-border backdrop-blur-sm">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-foreground mb-6">
                Task Manager
              </h1>

              {/* Tabs */}
              <div className="flex border-b border-border mb-6">
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === "short-term"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab("short-term")}
                >
                  Short-Term Tasks
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === "long-term"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab("long-term")}
                >
                  Long-Term Tasks
                </button>
              </div>

              {/* Tab content */}
              <TodoList isLongTerm={activeTab === "long-term"} />
            </div>
          </div>
        </div>
      </div>
    </TaskProvider>
  );
};

export default TodoPage;
