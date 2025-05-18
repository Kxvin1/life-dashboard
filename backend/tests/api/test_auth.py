import pytest
from app.core.security import create_access_token

# Test user email for token creation
TEST_USER_EMAIL = "test@example.com"


def test_token_creation():
    """Test that tokens can be created and decoded correctly"""
    # Create a valid token for test user
    token = create_access_token({"sub": TEST_USER_EMAIL})

    # Verify the token is a non-empty string
    assert isinstance(token, str)
    assert len(token) > 0

    # Verify the token contains the expected data
    from jose import jwt
    from app.core.config import settings

    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert payload["sub"] == TEST_USER_EMAIL
