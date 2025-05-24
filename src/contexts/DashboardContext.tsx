"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define the card types
export type CardCategory = "finance" | "productivity" | "health" | "personal";

export interface DashboardCard {
  id: string;
  title: string;
  description: string;
  href: string;
  category: CardCategory;
  isImplemented: boolean;
  icon?: string;
}

interface DashboardContextType {
  quickAccessCards: DashboardCard[];
  allCards: DashboardCard[];
  addToQuickAccess: (cardId: string) => void;
  removeFromQuickAccess: (cardId: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};

// Define all available cards
const defaultCards: DashboardCard[] = [
  // Finance Cards
  {
    id: "finance-overview",
    title: "Transactions",
    description: "View your transaction history and analyze spending patterns.",
    href: "/finance/overview",
    category: "finance",
    isImplemented: true,
  },
  {
    id: "finance-income-expense",
    title: "Add Transaction",
    description:
      "Record your income and expenses with customizable categories.",
    href: "/finance/transactions",
    category: "finance",
    isImplemented: true,
  },
  {
    id: "finance-subscriptions",
    title: "Subscriptions",
    description: "Track your recurring subscription payments and due dates.",
    href: "/finance/subscriptions",
    category: "finance",
    isImplemented: true,
  },

  // Productivity Cards
  {
    id: "productivity-todo",
    title: "Task Manager",
    description:
      "Create, edit, and complete tasks with due dates and priorities.",
    href: "/productivity/todo",
    category: "productivity",
    isImplemented: true,
  },
  {
    id: "productivity-pomodoro",
    title: "Pomodoro Timer",
    description: "Use a simple timer for focused work sessions and breaks.",
    href: "/productivity/pomodoro",
    category: "productivity",
    isImplemented: true,
  },

  // Health Cards
  {
    id: "health-mood",
    title: "Mood Journal",
    description: "Log your daily emotional state and add brief notes.",
    href: "/health/mood",
    category: "health",
    isImplemented: false,
  },

  {
    id: "health-sleep",
    title: "Sleep Log",
    description: "Record your bedtime, wake-up time, and sleep quality.",
    href: "/health/sleep",
    category: "health",
    isImplemented: false,
  },

  // Personal Organization Cards

  {
    id: "personal-reading",
    title: "Reading List",
    description: "Manage a list of books you want to read or have completed.",
    href: "/personal/reading",
    category: "personal",
    isImplemented: false,
  },

  {
    id: "personal-skills",
    title: "Skill Progress",
    description: "Track skills you're learning and log practice sessions.",
    href: "/personal/skills",
    category: "personal",
    isImplemented: false,
  },

  // Calendar Integration
  {
    id: "productivity-calendar",
    title: "Calendar",
    description: "View all your data in one unified calendar interface.",
    href: "/calendar",
    category: "productivity",
    isImplemented: false,
  },
];

// Default quick access cards (including featured teasers)
const defaultQuickAccess = [
  "finance-overview",
  "finance-income-expense",
  "finance-subscriptions",
  "productivity-pomodoro",
  "productivity-todo",
  "productivity-calendar", // Calendar teaser - prominently featured
];

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider = ({ children }: DashboardProviderProps) => {
  const [quickAccessCards, setQuickAccessCards] = useState<DashboardCard[]>([]);
  // Using defaultCards directly since we don't need to modify allCards after initialization
  const allCards = defaultCards;

  useEffect(() => {
    // Load quick access cards from localStorage or use defaults
    const savedQuickAccess = localStorage.getItem("quickAccessCards");

    if (savedQuickAccess) {
      try {
        const savedCardIds = JSON.parse(savedQuickAccess) as string[];
        const cards = savedCardIds
          .map((id) => defaultCards.find((card) => card.id === id))
          .filter((card): card is DashboardCard => card !== undefined);

        setQuickAccessCards(cards);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setQuickAccessCards(
          defaultCards.filter((card) => defaultQuickAccess.includes(card.id))
        );
      }
    } else {
      setQuickAccessCards(
        defaultCards.filter((card) => defaultQuickAccess.includes(card.id))
      );
    }
  }, []);

  // Save quick access cards to localStorage whenever they change
  useEffect(() => {
    if (quickAccessCards.length > 0) {
      const cardIds = quickAccessCards.map((card) => card.id);
      localStorage.setItem("quickAccessCards", JSON.stringify(cardIds));
    }
  }, [quickAccessCards]);

  const addToQuickAccess = (cardId: string) => {
    const cardToAdd = allCards.find((card) => card.id === cardId);
    if (cardToAdd && !quickAccessCards.some((card) => card.id === cardId)) {
      setQuickAccessCards([...quickAccessCards, cardToAdd]);
    }
  };

  const removeFromQuickAccess = (cardId: string) => {
    setQuickAccessCards(quickAccessCards.filter((card) => card.id !== cardId));
  };

  return (
    <DashboardContext.Provider
      value={{
        quickAccessCards,
        allCards,
        addToQuickAccess,
        removeFromQuickAccess,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
