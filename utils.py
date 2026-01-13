import pandas as pd

def load_dataset(city: str):
    if city.lower() == "singapore":
        return pd.read_csv("bus_dataset_singapore.csv")
    else:
        return pd.read_csv("bus_dataset_mumbai.csv")
