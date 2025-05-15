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
            logger.warning("OpenAI API key not found in settings")
            # Use a dummy key for initialization, but the service won't work
            self.api_key = "dummy_key_for_initialization"

        try:
            self.client = OpenAI(api_key=self.api_key)
            self.model = "gpt-3.5-turbo"
        except Exception as e:
            logger.error(f"Error initializing OpenAI client: {str(e)}")
            # Create a placeholder client that will raise appropriate errors when used
            self.client = None
            self.model = "gpt-3.5-turbo"

    def _generate_fallback_response(self, error_message: str) -> Dict[str, Any]:
        """Generate an error response when OpenAI API fails"""
        # Instead of generating fake data, we'll raise an exception that will be caught by the API endpoint
        raise Exception(f"AI Insights Error: {error_message}")

    async def analyze_transactions(
        self,
        aggregated_data: Dict[str, Any],
        categories: List[Dict[str, Any]],
        time_period: str = "all",
    ) -> Dict[str, Any]:
        """
        Analyze transactions using OpenAI and return insights

        Args:
            aggregated_data: Pre-aggregated transaction data
            categories: List of category objects
            time_period: Time period for analysis ("month", "quarter", "year", "all")

        Returns:
            Dictionary containing analysis results
        """
        try:
            # Extract metrics from aggregated data
            metrics = aggregated_data["metrics"]
            category_aggregation = aggregated_data["category_aggregation"]
            time_aggregation = aggregated_data["time_aggregation"]
            transaction_count = aggregated_data["transaction_count"]

            # Format the top expense categories for the prompt
            top_expenses_str = ""
            for expense in category_aggregation["top_expense_categories"]:
                top_expenses_str += f"- {expense['name']}: {expense['amount']}\n"

            # Format the top income categories for the prompt
            top_income_str = ""
            for income in category_aggregation["top_income_categories"]:
                top_income_str += f"- {income['name']}: {income['amount']}\n"

            # Create a more concise prompt with aggregated data
            prompt = f"""
            Analyze financial data for {time_period} ({transaction_count} transactions):

            Financial Metrics:
            - Total Income: {metrics['total_income']}
            - Total Expenses: {metrics['total_expenses']}
            - Net: {metrics['net']}
            - Savings Rate: {metrics['savings_rate']}%
            - Expense-to-Income Ratio: {metrics['expense_ratio']}

            Top Income Categories:
            {top_income_str}

            Top Expense Categories:
            {top_expenses_str}

            Monthly Trends:
            - Months: {json.dumps(time_aggregation['labels'])}
            - Income: {json.dumps(time_aggregation['income_data'])}
            - Expenses: {json.dumps(time_aggregation['expense_data'])}

            Provide JSON with only:
            1. Summary (2-3 sentences)
            2. 3-5 insights
            3. 3-5 recommendations

            JSON format:
            {{
                "summary": "Financial summary...",
                "insights": ["Insight 1", "Insight 2", "Insight 3"],
                "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
            }}

            Use exact values. Format large numbers properly (e.g., "$1.2M").
            """

            try:
                # Check if client is initialized
                if self.client is None:
                    logger.error("OpenAI client is not initialized")
                    return self._generate_fallback_response(
                        "OpenAI API key is missing or invalid. Please check your API key."
                    )

                # Call OpenAI API with optimized system message
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "Financial analyst. Use pre-calculated metrics. Format as JSON.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.0,  # Use temperature 0 for maximum accuracy and deterministic outputs
                    max_tokens=1000,  # Reduced from 1500 since we need less tokens for response
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
