import pandas as pd
from unittest.mock import patch


#################################################################
# Testing the responses together with fetching the data from ECB
#################################################################
def test_currencies(client):
    """
    Test the /currencies endpoint to ensure it returns a list of currencies.
    """
    response = client.get('/currencies')
    assert response.status_code == 200  # Ensure the response is OK
    data = response.get_json()
    assert 'currencies' in data  # Ensure the key 'currencies' exists in the response
    assert isinstance(data['currencies'], list)  # Ensure it's a list of currencies


def test_fx_rate_single_date(client):
    """
    Test the /fxrate endpoint for fetching a single date.
    """
    # Test with a valid date and currency
    response = client.get('/fxrate?currency=USD&date=2023-09-01')
    assert response.status_code == 200  # Ensure the response is OK
    data = response.get_json()
    assert 'rate' in data  # Ensure that a rate is returned
    assert isinstance(data['rate'], (float, int))  # Ensure the rate is a number

    # Test with an invalid date
    response = client.get('/fxrate?currency=USD&date=2023-99-99')
    assert response.status_code == 400  # Ensure the response indicates a bad request
    data = response.get_json()
    assert 'error' in data  # Ensure an error is returned


def test_fx_rate_date_range(client):
    """
    Test the /fxrate endpoint for fetching a date range.
    """
    response = client.get('/fxrate?currency=USD&startDate=2023-08-01&endDate=2023-09-01')
    assert response.status_code == 200  # Ensure the response is OK
    data = response.get_json()
    assert 'rates' in data  # Ensure that rates are returned
    assert isinstance(data['rates'], dict)  # Ensure it's a dictionary of date-rate pairs
    assert len(data['rates']) > 0  # Ensure there is at least one rate


def test_fx_rate_invalid_request(client):
    """
    Test the /fxrate endpoint with invalid or missing parameters.
    """
    # Test missing date and date range
    response = client.get('/fxrate?currency=USD')
    assert response.status_code == 400  # Ensure the response indicates a bad request
    data = response.get_json()
    assert 'error' in data  # Ensure an error is returned

    # Test startDate > endDate
    response = client.get('/fxrate?currency=USD&startDate=2023-09-01&endDate=2023-08-01')
    assert response.status_code == 400  # Ensure the response indicates a bad request
    data = response.get_json()
    assert 'error' in data  # Ensure an error is returned


#################################################################
# Testing the response for the static file
#################################################################
def test_static_file(client):
    """
    Test that static files are served correctly.
    """
    response = client.get('/')
    assert response.status_code == 200  # Ensure the response is OK
    assert b'FX Rate Finder' in response.data  # Ensure the index.html is returned


#################################################################
# Testing the responses together without fetching the data from ECB
#################################################################
# Mock data for testing
mock_data = pd.DataFrame({
    'USD': [1.097, 1.0985, 1.0932],
    'CZK': [23.951, 23.929, 24.034]
}, index=pd.to_datetime(['2023-08-01', '2023-08-02', '2023-08-03']))


# Mocking the ECB data loading process
@patch('data_loader.DataLoader.load_data', return_value=mock_data)
def test_currencies_mock(mockload_data, client):
    """
    Test the /currencies endpoint to ensure it returns a list of currencies.
    """
    response = client.get('/currencies')
    assert response.status_code == 200  # Ensure the response is OK
    data = response.get_json()
    assert 'currencies' in data  # Ensure the key 'currencies' exists in the response
    assert isinstance(data['currencies'], list)  # Ensure it's a list of currencies
    assert set(data['currencies']) == {'USD', 'CZK'}  # Assert specific values for currencies


@patch('data_loader.DataLoader.load_data', return_value=mock_data)
def test_fx_rate_single_date_mock(mockload_data, client):
    """
    Test the /fxrate endpoint for fetching a single date.
    """
    # Test with a valid date and currency
    response = client.get('/fxrate?currency=USD&date=2023-08-01')
    assert response.status_code == 200  # Ensure the response is OK
    data = response.get_json()
    assert 'rate' in data  # Ensure that a rate is returned
    assert isinstance(data['rate'], (float, int))  # Ensure the rate is a number
    assert data['rate'] == 1.097  # Check if mocked value is returned

    # Test with an invalid date
    response = client.get('/fxrate?currency=USD&date=2023-99-99')
    assert response.status_code == 400  # Ensure the response indicates a bad request
    data = response.get_json()
    assert 'error' in data  # Ensure an error is returned


@patch('data_loader.DataLoader.load_data', return_value=mock_data)
def test_fx_rate_date_range_mock(mockload_data, client):
    """
    Test the /fxrate endpoint for fetching a date range.
    """
    response = client.get('/fxrate?currency=CZK&startDate=2023-08-01&endDate=2023-08-03')
    assert response.status_code == 200  # Ensure the response is OK
    data = response.get_json()
    assert 'rates' in data  # Ensure that rates are returned
    assert isinstance(data['rates'], dict)  # Ensure it's a dictionary of date-rate pairs
    assert len(data['rates']) == 3
    assert list(data['rates'].values()) == [23.951, 23.929, 24.034]
    assert list(data['rates'].keys()) == ['2023-08-01', '2023-08-02', '2023-08-03']
