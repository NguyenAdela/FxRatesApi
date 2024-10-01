# FX Rates API
This project offers a REST API for retrieving foreign exchange (FX) rates, based on data from the European Central Bank (ECB). It loads data once at server startup, storing it for fast query handling without fetching it again. It allows rate retrieval for specific date or a range of dates, and provides a simple frontend to interact with the service.

- [Features](#features)
- [Technologies Used](#tech-used)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Running Application](#running-application)
- [API Endpoints](#api-endpoints)
- [Running Tests](#running-tests)

## <a name = 'features'>Features</a>

- Fetch FX rates for a specific date.
- Fetch FX rates for a range of dates.
- Fetch available currencies from the ECB dataset.
- Simple and user-friendly frontend interface.
- Data is loaded once from the ECB and kept in memory for fast queries.

## <a name = 'tech-used'>Technologies Used</a>

- **Python 3.12**: Programming language.
- **Flask**: Web framework used to create the REST API.
- **pandas**: Library for data manipulation, used to handle the CSV data from ECB.
- **requests**: Used for downloading the FX rates data from the ECB.
- **HTML/CSS/JavaScript**: Frontend interface.
- **pytest**: Used for writing and running unit tests.

## <a name='project-structure'>Project Structure</a>

```bash
FxRatesApi/
├── app.py               # Main Flask app with the API routes.
├── data_loader.py       # Class responsible for downloading and managing the ECB FX data.
├── static/              # Static files for the frontend (HTML, CSS, JS).
│   ├── index.html       # Main HTML file.
│   ├── style.css        # Styles for the frontend.
│   └── script.js        # JavaScript to handle form submissions and display results.
├── tests/               # Unit tests for the project.
│   ├── conftest.py      # Test setup (Flask test client configuration).
│   └── test_app.py      # Tests for the API endpoints.
├── requirements.txt     # List of project dependencies.
└── README.md            # Project documentation.
```

## <a name='setup'>Setup</a>
### Prerequisites
- **Python 3.12+**: Ensure that Python 3.12 or higher is installed on your system.
- **pip**: Python's package manager.
- **virtualenv**: A tool for creating isolated Python environments.

### 1. Create a Virtual Environment
It is recommended to create a virtual environment to isolate the project's dependencies from the global Python installation.

On Windows (PowerShell):
```bash
python -m venv venv
.\venv\Scripts\Activate
```
On macOS/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```
Once activated, you should see (venv) in your terminal, indicating that the virtual environment is active.

### 2. Install Dependencies
With the virtual environment activated, install the necessary packages listed in requirements.txt:
```bash
pip install -r requirements.txt
```

## <a name='setup'>Setup</a>
### 1. Run the Flask Application
Once the dependencies are installed, you can start the Flask app:
```bash
python app.py
```
This will start a local server on http://127.0.0.1:5000. You can open this URL in your browser to interact with the frontend of the application.
### 2. Access the Application
To interact with the application, open your browser and navigate to:
```http
http://127.0.0.1:5000
```
Here you will be able to:

- Select a currency.
- Choose between querying a single date or a date range.
- View FX rates based on your query.
- 
## <a name='api-endpoints'>API Endpoints</a>
### 1. /currencies - GET
Returns the list of available currencies.
```
GET /currencies
```
Example Response:
```json
{
  "currencies": ["USD", "JPY", "GBP", ...]
}

```

### 2. /fxrate - GET
Returns the FX rate for a specific date or a range of dates. 

Query Parameters:
- currency (required): The currency code (e.g., USD, EUR, etc.).
- date (optional): The date to query in YYYY-MM-DD format.
- start_date and end_date (optional): The date range to query in YYYY-MM-DD format.

Example Request for a Single Date:
```
GET /fxrate?currency=USD&date=2023-09-01
```
Example Response:
```json
{
  "currency": "CZK",
  "date": "2024-09-30",
  "rate": 25.184
}
```

Example Request for a Date Range:
```
GET /fxrate?currency=CZK&start_date=2023-08-01&end_date=2023-09-01
```
Example Response:
```json
{
  "currency": "USD",
  "start_date": "2023-08-01",
  "end_date": "2023-09-01",
  "rates": {
    "2023-08-01": 23.951,
    "2023-08-02": 23.929,
    "2023-08-03": 24.034,
    ...
  }
}

```

## <a name='running-tests'>Running Tests</a>
The project includes unit tests that verify the functionality of the API endpoints.

### 1. Install Testing Dependencies
If you haven't already, ensure that pytest and pytest-flask are installed:
```bash
pip install pytest pytest-flask
```
### 2. Run the Tests
To run the test suite:
```bash
set PYTHONPATH=%cd%
pytest
```
This command will run all the tests in the tests/ folder and provide feedback on whether the API endpoints and functionality are working as expected.