import Cookies from "js-cookie";
import { Category } from "@/types/finance";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const fetchCategories = async (type?: string): Promise<Category[]> => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Authentication token missing");
    }

    let url = `${API_URL}/api/v1/categories/`;
    if (type) {
      url += `?type=${type}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};
