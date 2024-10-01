// Event listener for when the HTML has completely loaded and parsed
document.addEventListener('DOMContentLoaded', populateCurrencyOptions);

/**
 * Populates the currency options in a select dropdown by fetching currencies from an endpoint.
 * Updates the UI with the fetched currency options.
 */
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

/**
 * Handles the visibility of query-related elements based on the selected query type.
 */
function handleQueryVisibility() {
    const queryTypeSelect = document.getElementById('queryType');
    const singleDateField = document.getElementById('singleDateField');
    const rangeDateFields = document.getElementById('rangeDateFields');

    queryTypeSelect.addEventListener('change', function () {
        const queryType = queryTypeSelect.value;
        toggleDateFields(queryType, singleDateField, rangeDateFields);
    });
}

/**
 * Toggles the visibility of date fields based on the query type.
 *
 * @param {string} queryType - The type of query ('single' or 'range').
 * @param {Element} singleDateField - The single date field element.
 * @param {Element} rangeDateFields - The range date fields element.
 *
 * @return {void}
 */
function toggleDateFields(queryType, singleDateField, rangeDateFields) {
    if (queryType === 'single') {
        toggleVisibility(singleDateField, 'visible');
        toggleVisibility(rangeDateFields, 'hidden');
    } else if (queryType === 'range') {
        toggleVisibility(singleDateField, 'hidden');
        toggleVisibility(rangeDateFields, 'visible');
    }
}

/**
 * Toggles the visibility of an element by adding or removing visibility classes.
 *
 * @param {HTMLElement} element - The element whose visibility needs to be toggled.
 * @param {string} visibilityState - The new visibility state to be set (e.g., 'hidden', 'visible').
 * @returns {void}
 */
function toggleVisibility(element, visibilityState) {
    element.classList.remove('hidden', 'visible');
    element.classList.add(visibilityState);
}

/**
 * Attaches an event listener to a form element and handles the form submission.
 *
 * @function handleFormSubmission
 * @returns {void}
 */
function handleFormSubmission() {
    document.getElementById('fxForm').addEventListener('submit', submitForm);
}

/**
 * Submits a form by fetching FX rates from a given URL and
 * prepares the data based on the selected currency.
 *
 * @param {Event} event - The form submission event.
 *
 * @return {Promise<void>} - A promise that resolves when the
 *     fetch and data preparation processes are completed.
 *     If an error occurs, the promise rejects with the error.
 */
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

/**
 * Builds a URL based on the form values of currency and query type.
 *
 * @return {string} The generated URL based on the form values.
 */
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

/**
 * Async function to prepare data for display and CSV export.
 *
 * @param {object} data - The data object containing rates or error.
 * @param {string} currency - The currency code.
 * @returns {void}
 */
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

/**
 * Display FX rates for a specific currency within a given date range.
 *
 * @param {object} data - The data object containing the rates and date range.
 * @param {string} currency - The currency code to display rates for.
 * @param {HTMLElement} resultDiv - The HTML element where the rates will be displayed.
 * @param {array} csvData - The array where the CSV data will be stored.
 *
 * @return {void}
 */
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

/**
 * Displays the foreign exchange (FX) rate for a single date in a specified currency.
 * It creates an HTML table with the FX rate information, and appends it to a specified resultDiv element.
 * It also adds the FX rate data to a specified csvData array and appends a download button with the CSV file.
 *
 * @param {object} data - The FX rate data for the single date.
 * @param {string} currency - The currency code for which the FX rate is being displayed.
 * @param {HTMLElement} resultDiv - The HTML element where the result should be displayed.
 * @param {array} csvData - The array of CSV data to which the FX rate data should be added.
 *
 * @return {void}
 */
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

/**
 * Adds a listener to the download button element.
 *
 * @param {string} csvData - The CSV data to be downloaded.
 * @param {string} filename - The name of the downloaded file.
 * @return {void}
 */
function addDownloadButtonListener(csvData, filename) {
    document.getElementById('downloadCSV').addEventListener('click', function() {
        downloadCSV(csvData, filename);
    });
}

/**
 * Downloads a CSV file with the given data.
 *
 * @param {Array<Array<string|number>>} data - The data to be converted to CSV format.
 * @param {string} filename - The name of the downloaded file.
 * @return {void}
 */
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