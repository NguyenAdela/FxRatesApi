import pandas as pd
import requests
from zipfile import ZipFile
from io import BytesIO

ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip"


class DataLoader:
    def __init__(self):
        """
        Initializes the DataLoader by downloading the FX rates and loading
        them into a pandas DataFrame.
        """
        self.fx_data = self.load_data()

    def load_data(self):
        """
        Fetches the FX rate data from the ECB website, unzips it, and loads it into
        a pandas DataFrame.
        """
        response = requests.get(ECB_URL)
        zip_file = ZipFile(BytesIO(response.content))
        csv_filename = zip_file.namelist()[0]
        csv_file = zip_file.open(csv_filename)

        # Load the CSV into a pandas DataFrame
        df = pd.read_csv(csv_file, parse_dates=['Date'])
        # Drop columns that have "Unnamed" in the name
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

        df.set_index('Date', inplace=True)  # Set the Date column as the index
        df = df.sort_values('Date')
        return df

    def get_closest_date(self, target_date, direction="start"):
        """
        Returns the closest available date greater than or equal to the target date
        for the start date or less than or equal to the target date for end date.

        :param target_date: str, The date for which to find the closest available FX rate date. Expected format is 'YYYY-MM-DD'.
        :param direction: str, Can be either 'start' to find the closest future date or 'end' to find the closest past date. Default is 'start'.
        :return: str, The closest valid date in 'YYYY-MM-DD' format, or None if not found.
        """
        target_date = pd.Timestamp(target_date)

        if target_date in self.fx_data.index:
            return target_date

        if direction == "start":
            available_dates = self.fx_data.index[self.fx_data.index >= target_date]
        elif direction == "end":
            available_dates = self.fx_data.index[self.fx_data.index <= target_date]
        else:
            return None

        # Return the closest date if found, otherwise None
        if available_dates.empty:
            return None
        return available_dates[0] if direction == "start" else available_dates[-1]
    def get_rate(self, date, currency):
        """
        Fetches the FX rate for a given date and currency.

        :param date: str, A date for which you need the FX rate. Expected format is 'YYYY-MM-DD'.
        :param currency: str, The currency code (e.g., 'USD').
        :return: float, The FX rate if available, or None if not found.
        """
        try:
            # Convert datetime.date to pd.Timestamp for querying
            date = pd.Timestamp(date)
            rate = self.fx_data.at[date, currency.upper()]
            if pd.isna(rate):
                return None
            return rate
        except KeyError:
            return None


    def get_rates_range(self, start_date, end_date, currency):
        """
        Fetches the FX rates for a given currency over a range of dates.
        If the start or end date is not present in the DataFrame, it returns the next available date.

        :param start_date: str, The start date for which you need the FX rate. Expected format is 'YYYY-MM-DD'.
        :param end_date: str, The end date for which you need the FX rate. Expected format is 'YYYY-MM-DD'.
        :param currency: str, The currency code (e.g., 'USD').
        :return: dict, A dictionary of dates and rates in the format {'YYYY-MM-DD': rate}, or None if no data is found.
        """


        # Adjust start and end dates to the closest available dates
        start_date = self.get_closest_date(start_date, direction="start")
        end_date = self.get_closest_date(end_date, direction="end")

        # If either start_date or end_date could not be found, return None
        if start_date is None or end_date is None:
            return None

        # Now that we have valid start and end dates, retrieve the data
        try:
            rates_series = self.fx_data.loc[start_date:end_date, currency.upper()]
            rates_series = rates_series.dropna()
            rates_dict = {date.strftime('%Y-%m-%d'): rate for date, rate in rates_series.items()}# Remove NaN values
            if rates_series.empty:
                return None
            return rates_dict
        except KeyError:
            return None
