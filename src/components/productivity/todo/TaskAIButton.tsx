"use client";

import { useState, useEffect } from "react";
import { useTask } from "@/contexts/TaskContext";
import { useAuth } from "@/contexts/AuthContext";

const TaskAIButton = () => {
  const { isDemoUser } = useAuth();
  const {
    aiRemainingUses,
    aiTotalAllowed,
    isAILoading,
    checkAIRemainingUses,
    generateTasksFromGoal,
  } = useTask();

  const [showModal, setShowModal] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check remaining uses on initial render
  useEffect(() => {
    checkAIRemainingUses();
  }, [checkAIRemainingUses]);

  // Handle modal open
  const handleOpenModal = () => {
    if (isDemoUser) return;
    if (aiRemainingUses <= 0) return;
    setShowModal(true);
    setGoalText("");
    setError(null);
    setSuccess(null);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const tasks = await generateTasksFromGoal(goalText);
      setSuccess(`Successfully created ${tasks.length} tasks from your goal!`);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center border border-border rounded-md p-3 bg-card/50 shadow-sm">
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          <div className="relative group">
            <button
              onClick={handleOpenModal}
              disabled={isDemoUser || aiRemainingUses <= 0 || isAILoading}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDemoUser || aiRemainingUses <= 0
                  ? "bg-secondary text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
              aria-label="Break down goal with AI"
            >
              {isAILoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current rounded-full animate-spin border-t-transparent"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                  <span>AI Goal Breakdown</span>
                </>
              )}
            </button>

            {/* Tooltip for disabled state */}
            {(isDemoUser || aiRemainingUses <= 0) && (
              <div className="absolute z-50 w-64 p-2 mb-2 text-xs transition-opacity transform -translate-x-1/2 rounded shadow-lg opacity-0 pointer-events-none bottom-full left-1/2 bg-popover text-popover-foreground group-hover:opacity-100">
                <div className="mb-1 font-medium">
                  {isDemoUser
                    ? "AI Goal Breakdown Unavailable in Demo Mode"
                    : "No AI Uses Remaining Today"}
                </div>
                <p>
                  {isDemoUser
                    ? "Sign up for a full account to access this feature."
                    : `You've used all ${aiTotalAllowed} of your daily AI uses. Try again tomorrow.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status message */}
        <div className="text-xs text-muted-foreground">
          {isDemoUser ? (
            <span className="text-amber-500">
              AI Goal Breakdown is not available in demo mode
            </span>
          ) : aiRemainingUses !== null ? (
            aiRemainingUses > 0 ? (
              <span>
                {aiRemainingUses} of {aiTotalAllowed} uses remaining today
              </span>
            ) : (
              <span className="text-amber-500">No uses remaining today</span>
            )
          ) : (
            "Loading..."
          )}
        </div>
      </div>

      {/* AI Goal Breakdown Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground">
                  AI Goal Breakdown
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <p className="mb-4 text-muted-foreground">
                Describe your long-term goal, and AI will break it down into
                actionable tasks. This will use 1 of your {aiTotalAllowed} daily
                AI uses.
              </p>

              {error && (
                <div className="p-3 mb-4 text-sm border rounded-md bg-destructive/10 border-destructive/20 text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 mb-4 text-sm text-green-500 border rounded-md bg-green-500/10 border-green-500/20">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="goalText"
                    className="block mb-1 text-sm font-medium text-foreground"
                  >
                    Describe your goal
                  </label>
                  <textarea
                    id="goalText"
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    placeholder="e.g., Learn to play the guitar in 3 months"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground min-h-[120px] resize-y"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-md bg-secondary text-foreground"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground"
                    disabled={isSubmitting || !goalText.trim()}
                  >
                    {isSubmitting && (
                      <span className="w-4 h-4 mr-2 border-2 rounded-full border-primary-foreground animate-spin border-t-transparent"></span>
                    )}
                    Break Down Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskAIButton;
