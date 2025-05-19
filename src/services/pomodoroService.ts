import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface PomodoroSession {
  id: number;
  user_id: number;
  task_name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: "completed" | "interrupted";
  notes?: string;
  created_at: string;
}

export interface PomodoroSessionsResponse {
  items: PomodoroSession[];
  total: number;
  page: number;
  size: number;
  has_more: boolean;
  streak_count: number;
}

export interface PomodoroAIResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  charts: {
    daily_chart: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
    completion_chart: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
    time_of_day_chart: {
      labels: number[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
  };
  remaining_uses: number;
  total_uses_allowed: number;
  history_id?: number;
}

export interface PomodoroAIHistoryItem {
  id: number;
  user_id: number;
  summary: string;
  insights: string[];
  recommendations: string[];
  charts_data: {
    daily_chart: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
    completion_chart: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
    time_of_day_chart: {
      labels: number[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
      }[];
    };
  };
  created_at: string;
}

export interface PomodoroAIRemainingResponse {
  remaining_uses: number;
  total_uses_allowed: number;
  reset_time: string;
}

export interface PomodoroCountsResponse {
  today: number;
  week: number;
  total: number;
}

export const createPomodoroSession = async (sessionData: {
  task_name: string;
  start_time: Date;
  end_time: Date;
  duration_minutes: number;
  status: "completed" | "interrupted";
  notes?: string;
}): Promise<PomodoroSession> => {
  try {
    const token = Cookies.get("token");

    const response = await fetch(`${API_URL}/api/v1/pomodoro/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create Pomodoro session");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating Pomodoro session:", error);
    throw error;
  }
};

export const getPomodoroSessions = async (
  page: number = 1,
  limit: number = 10
): Promise<PomodoroSessionsResponse> => {
  try {
    const token = Cookies.get("token");
    const skip = (page - 1) * limit;

    const response = await fetch(
      `${API_URL}/api/v1/pomodoro/sessions?skip=${skip}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch Pomodoro sessions");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching Pomodoro sessions:", error);
    throw error;
  }
};

export const analyzePomodoroSessions =
  async (): Promise<PomodoroAIResponse> => {
    try {
      const token = Cookies.get("token");

      const response = await fetch(`${API_URL}/api/v1/pomodoro/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to analyze Pomodoro sessions"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error analyzing Pomodoro sessions:", error);
      throw error;
    }
  };

export const getRemainingPomodoroAIUses =
  async (): Promise<PomodoroAIRemainingResponse> => {
    try {
      const token = Cookies.get("token");

      const response = await fetch(`${API_URL}/api/v1/pomodoro/remaining`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to fetch remaining AI uses"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching remaining AI uses:", error);
      throw error;
    }
  };

export const getPomodoroAIHistory = async (
  skip: number = 0,
  limit: number = 10
): Promise<PomodoroAIHistoryItem[]> => {
  try {
    const token = Cookies.get("token");

    const response = await fetch(
      `${API_URL}/api/v1/pomodoro/history?skip=${skip}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get Pomodoro AI history");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting Pomodoro AI history:", error);
    throw error;
  }
};

export const getPomodoroAIHistoryById = async (
  id: number
): Promise<PomodoroAIHistoryItem> => {
  try {
    const token = Cookies.get("token");

    const response = await fetch(`${API_URL}/api/v1/pomodoro/history/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || "Failed to get Pomodoro AI history item"
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting Pomodoro AI history item:", error);
    throw error;
  }
};

export const getPomodoroCounts = async (): Promise<PomodoroCountsResponse> => {
  try {
    const token = Cookies.get("token");

    const response = await fetch(`${API_URL}/api/v1/pomodoro/counts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get Pomodoro counts");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting Pomodoro counts:", error);
    // Return default values if there's an error
    return { today: 0, week: 0, total: 0 };
  }
};
