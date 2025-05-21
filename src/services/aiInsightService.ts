import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface AIInsightResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  charts: {
    categoryDistribution?: ChartData;
    incomeVsExpenses?: ChartData;
    spendingTrends?: ChartData;
    [key: string]: ChartData | undefined;
  };
  remaining_uses: number;
  total_uses_allowed: number;
  history_id?: number;
  time_period?: string; // The time period for the analysis
}

export interface AIInsightRemainingResponse {
  remaining_uses: number;
  total_uses_allowed: number;
  reset_time: string;
}

export interface AIInsightHistoryItem {
  id: number;
  user_id: number;
  time_period: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  charts_data: {
    categoryDistribution?: ChartData;
    incomeVsExpenses?: ChartData;
    spendingTrends?: ChartData;
    [key: string]: ChartData | undefined;
  };
  created_at: string;
  remaining_uses?: number;
  total_uses_allowed?: number;
}

export interface TransactionRequirementsResponse {
  has_income: boolean;
  has_expense: boolean;
  can_generate_insights: boolean;
  time_period: string;
}

export const getAIInsights = async (
  timePeriod: string = "all"
): Promise<AIInsightResponse> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    const response = await fetch(`${API_URL}/api/v1/insights/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ time_period: timePeriod }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.detail || "Failed to get AI insights";

      // Check for specific OpenAI errors
      if (errorMessage.includes("OpenAI API")) {
        throw new Error(
          `OpenAI API error: ${errorMessage}. Please check your API key and try again later.`
        );
      } else if (errorMessage.includes("AI Insights Error")) {
        throw new Error(errorMessage);
      } else {
        throw new Error(errorMessage);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred while getting AI insights");
    }
  }
};

export const getRemainingInsights =
  async (): Promise<AIInsightRemainingResponse> => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("Authentication token missing");
      }

      // Add a timestamp to prevent browser caching
      const timestamp = new Date().getTime();

      const response = await fetch(
        `${API_URL}/api/v1/insights/remaining?_=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // Use cache: 'no-store' which is safer for CORS
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to get remaining insights");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  };

export const testOpenAIConnection = async (): Promise<any> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    // Add a timestamp to prevent browser caching
    const timestamp = new Date().getTime();

    const response = await fetch(
      `${API_URL}/api/v1/insights/test?_=${timestamp}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Use cache: 'no-store' which is safer for CORS
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to test OpenAI connection");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const getInsightHistory = async (
  skip: number = 0,
  limit: number = 10
): Promise<AIInsightHistoryItem[]> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    // Add a timestamp to prevent browser caching
    const timestamp = new Date().getTime();

    const response = await fetch(
      `${API_URL}/api/v1/insights/history?skip=${skip}&limit=${limit}&_=${timestamp}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Use cache: 'no-store' which is safer for CORS
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get insight history");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const getInsightById = async (
  insightId: number
): Promise<AIInsightHistoryItem> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    // Add a timestamp to prevent browser caching
    const timestamp = new Date().getTime();

    const response = await fetch(
      `${API_URL}/api/v1/insights/history/${insightId}?_=${timestamp}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Use cache: 'no-store' which is safer for CORS
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get insight details");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const checkTransactionRequirements = async (
  timePeriod: string = "all"
): Promise<TransactionRequirementsResponse> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    // Add a timestamp to prevent browser caching
    const timestamp = new Date().getTime();

    const response = await fetch(
      `${API_URL}/api/v1/transactions/has-income-and-expense/?time_period=${timePeriod}&_=${timestamp}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Use cache: 'no-store' which is safer for CORS
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || "Failed to check transaction requirements"
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(
        "An unexpected error occurred while checking transaction requirements"
      );
    }
  }
};
