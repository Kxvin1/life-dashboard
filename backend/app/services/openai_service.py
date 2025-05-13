import os
from typing import Dict, Any, List, Optional
import json
from openai import OpenAI
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class OpenAIService:
    """Service for interacting with OpenAI API"""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if not self.api_key:
            logger.error("OpenAI API key not found in settings")
            raise ValueError("OpenAI API key not found in settings")

        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-3.5-turbo"

    async def analyze_transactions(
        self,
        transactions: List[Dict[str, Any]],
        categories: List[Dict[str, Any]],
        time_period: str = "all",
    ) -> Dict[str, Any]:
        """
        Analyze transactions using OpenAI and return insights

        Args:
            transactions: List of transaction objects
            categories: List of category objects
            time_period: Time period for analysis ("month", "quarter", "year", "all")

        Returns:
            Dictionary containing analysis results
        """
        try:
            # Calculate total income and expenses directly
            total_income = sum(
                t["amount"] for t in transactions if t["type"] == "income"
            )
            total_expenses = sum(
                t["amount"] for t in transactions if t["type"] == "expense"
            )

            # Prepare the data for OpenAI
            transaction_data = json.dumps(transactions, default=str)
            category_data = json.dumps(categories, default=str)

            # Create the prompt
            prompt = f"""
            You are a financial analyst AI. Analyze the following transaction data and provide concise, actionable insights.

            IMPORTANT FINANCIAL TOTALS (PRE-CALCULATED):
            - Total Income: {total_income}
            - Total Expenses: {total_expenses}
            - Net Income: {total_income - total_expenses}

            Transaction data: {transaction_data}

            Category data: {category_data}

            Time period: {time_period}

            IMPORTANT INSTRUCTIONS FOR ANALYSIS:
            - USE THE PRE-CALCULATED FINANCIAL TOTALS provided above - they are accurate and include ALL transactions
            - DO NOT recalculate these totals yourself - use the exact values provided
            - The total income is EXACTLY {total_income}
            - The total expenses is EXACTLY {total_expenses}
            - Pay careful attention to transaction amounts
            - For large numbers, use the exact values provided in the "amount" field
            - For millions, use the "amount_millions" field which gives the value in millions (e.g., 31.2 for $31.2 million)
            - For billions, use the "amount_billions" field which gives the value in billions
            - When reporting large numbers in insights, use proper formatting (e.g., "$1.2 million" or "$31.2 million")
            - Do not truncate or round large numbers incorrectly
            - Make sure to identify the ACTUAL largest expenses and income by checking the raw amount values

            IMPORTANT METRICS TO CALCULATE AND INCLUDE:
            - Savings rate (income minus expenses divided by income)
            - Expense-to-income ratio
            - Top 3 expense categories by percentage
            - Month-over-month growth/reduction in spending
            - Largest recurring expenses
            - Unusual or one-time large transactions

            Please provide:
            1. A concise summary of the financial situation (2-3 sentences maximum)
            2. 3-5 specific, data-driven insights about spending patterns
            3. 3-5 actionable recommendations for improving financial health
            4. Data for visualizations (in the exact JSON format specified below)

            Format your response as a JSON object with the following structure:
            {{
                "summary": "Concise financial summary focusing on key metrics...",
                "insights": [
                    "Specific insight about top expense category...",
                    "Insight about savings rate...",
                    "Insight about spending trends...",
                    "Insight about unusual transactions if any..."
                ],
                "recommendations": [
                    "Specific, actionable recommendation related to biggest expense...",
                    "Recommendation about improving savings rate...",
                    "Recommendation about reducing specific costs..."
                ],
                "charts": {{
                    "categoryDistribution": {{
                        "labels": ["Housing", "Food", "Transportation", etc.],
                        "datasets": [{{
                            "data": [30, 20, 15, etc.],
                            "backgroundColor": ["#4ade80", "#3b82f6", "#f97316", etc.]
                        }}]
                    }},
                    "incomeVsExpenses": {{
                        "labels": ["Jan", "Feb", etc.],
                        "datasets": [
                            {{
                                "label": "Income",
                                "data": [1000, 1200, etc.],
                                "backgroundColor": "#4ade80"
                            }},
                            {{
                                "label": "Expenses",
                                "data": [800, 950, etc.],
                                "backgroundColor": "#ef4444"
                            }}
                        ]
                    }},
                    "spendingTrends": {{
                        "labels": ["Jan", "Feb", etc.],
                        "datasets": [
                            {{
                                "label": "Category1",
                                "data": [300, 320, etc.],
                                "borderColor": "#4ade80"
                            }},
                            {{
                                "label": "Category2",
                                "data": [200, 220, etc.],
                                "borderColor": "#3b82f6"
                            }}
                        ]
                    }}
                }}
            }}

            IMPORTANT: Focus on providing specific, actionable insights rather than generic financial advice. Use actual numbers and percentages from the data. Be very careful with large numbers and report them accurately.
            """

            try:
                # Call OpenAI API
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a financial analysis assistant that provides specific, data-driven insights and visualizations based on transaction data. Focus on calculating key financial metrics and providing actionable recommendations. Always use actual numbers and percentages from the data. Be concise and specific rather than generic. CRITICAL: Use the PRE-CALCULATED FINANCIAL TOTALS provided at the beginning of the prompt. These totals are accurate and have been calculated by summing ALL transactions. Pay special attention to large numbers (millions/billions) and ensure you're using the exact values, not truncated or rounded versions. For large transactions, use the amount_millions or amount_billions fields provided. IMPORTANT: You must respond with valid JSON only, no additional text or explanations outside the JSON structure.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.0,  # Use temperature 0 for maximum accuracy and deterministic outputs
                    max_tokens=2000,
                    response_format={"type": "json_object"},  # Force JSON response
                )

                # Extract and parse the response
                content = response.choices[0].message.content

                # Try to parse the JSON response
                try:
                    result = json.loads(content)
                    # Add the time period to the result
                    result["time_period"] = time_period
                    return result
                except json.JSONDecodeError:
                    # If the response is not valid JSON, try to extract JSON from the text
                    logger.warning(
                        "Failed to parse OpenAI response as JSON, attempting to extract JSON"
                    )

                    # Look for JSON-like content between curly braces
                    start_idx = content.find("{")
                    end_idx = content.rfind("}") + 1

                    if start_idx >= 0 and end_idx > start_idx:
                        json_str = content[start_idx:end_idx]
                        try:
                            result = json.loads(json_str)
                            # Add the time period to the result
                            result["time_period"] = time_period
                            return result
                        except json.JSONDecodeError:
                            logger.error("Failed to extract JSON from OpenAI response")

                    # If all parsing attempts fail, return a structured error response
                    return self._generate_fallback_response(
                        "Unable to analyze transactions due to a processing error."
                    )

            except Exception as e:
                logger.error(f"Error calling OpenAI API: {str(e)}")

                # Check for quota exceeded error
                error_message = str(e)
                if (
                    "quota" in error_message.lower()
                    or "insufficient_quota" in error_message
                ):
                    return self._generate_fallback_response(
                        "OpenAI API quota exceeded. Please check your API key and billing details."
                    )
                elif (
                    "rate limit" in error_message.lower()
                    or "rate_limit" in error_message
                ):
                    return self._generate_fallback_response(
                        "OpenAI API rate limit reached. Please try again later."
                    )
                else:
                    return self._generate_fallback_response(
                        "Error connecting to OpenAI API. Please try again later."
                    )

        except Exception as e:
            logger.error(f"Unexpected error in analyze_transactions: {str(e)}")
            return self._generate_fallback_response(
                "An unexpected error occurred while analyzing transactions."
            )

    def _generate_fallback_response(self, error_message: str) -> Dict[str, Any]:
        """Generate an error response when OpenAI API fails"""

        # Instead of generating fake data, we'll raise an exception that will be caught by the API endpoint
        raise Exception(f"AI Insights Error: {error_message}")
