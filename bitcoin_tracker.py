import csv
import os
import time
from datetime import datetime

import requests

CSV_FILE = "bitcoin_prices.csv"
API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
INTERVAL = 60  # seconds


def fetch_bitcoin_price():
    response = requests.get(API_URL, timeout=10)
    response.raise_for_status()
    data = response.json()
    return data["bitcoin"]["usd"]


def append_to_csv(timestamp, price):
    file_exists = os.path.isfile(CSV_FILE)
    with open(CSV_FILE, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["timestamp", "price_usd"])
        writer.writerow([timestamp, price])


def main():
    print(f"Bitcoin price tracker started. Saving to '{CSV_FILE}' every {INTERVAL}s.")
    print("Press Ctrl+C to stop.\n")

    while True:
        try:
            price = fetch_bitcoin_price()
            timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")
            append_to_csv(timestamp, price)
            print(f"[{timestamp}] BTC/USD: ${price:,.2f}")
        except requests.RequestException as e:
            print(f"[{datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S')}] Error fetching price: {e}")

        time.sleep(INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nTracker stopped.")
