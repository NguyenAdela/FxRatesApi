import pytest
from app import app

@pytest.fixture
def client():
    """
    Set up a test client for the Flask app.
    """
    app.config['TESTING'] = True  # Enable testing mode
    with app.test_client() as client:
        yield client