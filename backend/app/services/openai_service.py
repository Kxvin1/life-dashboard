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

            # Create a more concise prompt to reduce token usage
            prompt = f"""
            Analyze financial data for {time_period}:
            - Income: {total_income}
            - Expenses: {total_expenses}
            - Net: {total_income - total_expenses}

            Transaction data: {transaction_data}
            Category data: {category_data}

            Calculate:
            - Savings rate (%)
            - Expense-to-income ratio
            - Top expense categories
            - Spending patterns

            Provide JSON with:
            1. Summary (2-3 sentences)
            2. 3-5 insights
            3. 3-5 recommendations
            4. Chart data

            JSON format:
            {{
                "summary": "Financial summary...",
                "insights": ["Insight 1", "Insight 2", "Insight 3"],
                "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
                "charts": {{
                    "categoryDistribution": {{
                        "labels": ["Category1", "Category2"],
                        "datasets": [{{ "data": [value1, value2], "backgroundColor": ["#4ade80", "#3b82f6"] }}]
                    }},
                    "incomeVsExpenses": {{
                        "labels": ["Period"],
                        "datasets": [
                            {{ "label": "Income", "data": [income], "backgroundColor": "#4ade80" }},
                            {{ "label": "Expenses", "data": [expenses], "backgroundColor": "#ef4444" }}
                        ]
                    }}
                }}
            }}

            Use exact values. Format large numbers properly (e.g., "$1.2M").
            """

            try:
                # Call OpenAI API
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a financial analyst. Provide data-driven insights based on transaction data. Use the pre-calculated totals. Format large numbers properly. Respond with valid JSON only.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.0,  # Use temperature 0 for maximum accuracy and deterministic outputs
                    max_tokens=1500,
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
