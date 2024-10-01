// Event listener for when the HTML has completely loaded and parsed
document.addEventListener('DOMContentLoaded', populateCurrencyOptions);

async function populateCurrencyOptions() {
    try {
        const response = await fetch('/currencies');
        const data = await response.json();

        const currencySelect = document.getElementById('currency');
        data.currencies.forEach(currency => {
            const currencyOption = document.createElement('option');
            currencyOption.value = currency;
            currencyOption.text = currency;
            currencySelect.appendChild(currencyOption);
        });
    } catch (error) {
        console.error('Error fetching currencies:', error);
    }

    handleQueryVisibility();
    handleFormSubmission();
}

function handleQueryVisibility() {
    const queryTypeSelect = document.getElementById('queryType');
    const singleDateField = document.getElementById('singleDateField');
    const rangeDateFields = document.getElementById('rangeDateFields');

    queryTypeSelect.addEventListener('change', function () {
        const queryType = queryTypeSelect.value;
        toggleDateFields(queryType, singleDateField, rangeDateFields);
    });
}

function toggleDateFields(queryType, singleDateField, rangeDateFields) {
    if (queryType === 'single') {
        toggleVisibility(singleDateField, 'visible');
        toggleVisibility(rangeDateFields, 'hidden');
    } else if (queryType === 'range') {
        toggleVisibility(singleDateField, 'hidden');
        toggleVisibility(rangeDateFields, 'visible');
    }
}

function toggleVisibility(element, visibilityState) {
    element.classList.remove('hidden', 'visible');
    element.classList.add(visibilityState);
}

function handleFormSubmission() {
    document.getElementById('fxForm').addEventListener('submit', submitForm);
}

async function submitForm(event) {
    event.preventDefault();  // Prevent default form submission

    const url = buildUrlBasedOnFormValues();
    const currency = document.getElementById('currency').value;

    if (!url) {
        return;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        prepareData(data, currency);
    } catch (error) {
        console.error('Error fetching FX rates:', error);
        document.getElementById('result').innerHTML = `<p>Error fetching FX rates.</p>`;
    }
}

function buildUrlBasedOnFormValues() {
    const currency = document.getElementById('currency').value;
    const queryType = document.getElementById('queryType').value;
    let url = '';

    if (queryType === 'single') {
        const date = document.getElementById('date').value;
        if (!date) {
            alert("Please select a date.");
            return "";
        }
        url = `/fxrate?currency=${currency}&date=${date}`;
    } else if (queryType === 'range') {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (!startDate || !endDate) {
            alert("Please select both start and end dates.");
            return "";
        }
        url = `/fxrate?currency=${currency}&startDate=${startDate}&endDate=${endDate}`;
    }
    return url;
}

async function prepareData(data, currency) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';  // Clear previous results
    // Prepare head row for CSV
    let csvData = [["Date", "Rate"]];

    // Check for any error in the data
    if (data.error) {
        resultDiv.innerHTML = `<p>${data.error}</p>`;
    } else if (data.rates) {
        displayRatesForDateRange(data, currency, resultDiv, csvData);
    } else if (data.rate) {
        displayRateForSingleDate(data, currency, resultDiv, csvData);
    }
}

function displayRatesForDateRange(data, currency, resultDiv, csvData) {
    let resultHtml = `
        <h3>FX Rates for EUR${currency} from ${data.startDate} to ${data.endDate}:</h3>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Rate</th>
                </tr>
            </thead>
    <tbody>`;
    // Iterate through all the rate entries
    for (const [date, rate] of Object.entries(data.rates)) {
        resultHtml += `
            <tr>
                <td>${date}</td>
                <td>${rate}</td>
            </tr>`;
        csvData.push([date, rate]);
    }
    resultHtml += `
            </tbody>
        </table>
        <button id="downloadCSV">Download as CSV</button>`;
    resultDiv.innerHTML = resultHtml;
    addDownloadButtonListener(csvData, `FX_Rates_${currency}_${data.startDate}_to_${data.endDate}.csv`);
}

function displayRateForSingleDate(data, currency, resultDiv, csvData) {
    const resultHtml = ` 
        <h3>FX Rate for EUR${currency} on ${data.date}:</h3>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Rate</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${data.date}</td>
                    <td>${data.rate}</td>
                </tr>
            </tbody>
        </table>
        <button id="downloadCSV">Download as CSV</button>`;
    resultDiv.innerHTML = resultHtml;

    csvData.push([data.date, data.rate]);
    addDownloadButtonListener(csvData, `FX_Rate_${currency}_${data.date}.csv`);
}

function addDownloadButtonListener(csvData, filename) {
    document.getElementById('downloadCSV').addEventListener('click', function() {
        downloadCSV(csvData, filename);
    });
}

function downloadCSV(data, filename) {
    // Prepare CSV content from the data
    let csvContent = "data:text/csv;charset=utf-8,"
        + data.map(row => row.join(",")).join("\n");
    // Encode CSV content and set it as href of link element
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    // Append the link to body (it's invisible)
    document.body.appendChild(link);
    // Automatically click the link to trigger download
    link.click();
    // Remove the link from body after triggering download
    document.body.removeChild(link);
}