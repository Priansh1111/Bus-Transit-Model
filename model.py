import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
import pickle

# Load Singapore dataset
df = pd.read_csv("bus_dataset_singapore.csv")

# Encode categorical features
le_crowd = LabelEncoder()
le_traffic = LabelEncoder()
le_user_exp = LabelEncoder()

df['crowd_encoded'] = le_crowd.fit_transform(df['crowd'])
df['traffic_encoded'] = le_traffic.fit_transform(df['traffic'])
df['user_exp_encoded'] = le_user_exp.fit_transform(df['user_experience'])

# ✅ Correct target
y = df['total_journey']

# ✅ Features (4 total: dummy + encodings)
df['prev_travel_time'] = 0  # keep dummy column
X = df[['prev_travel_time', 'crowd_encoded', 'traffic_encoded', 'user_exp_encoded']]

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

# Save model and encoders
with open("saved_model.pkl", "wb") as f:
    pickle.dump({
        "model": model,
        "le_crowd": le_crowd,
        "le_traffic": le_traffic,
        "le_user_exp": le_user_exp
    }, f)

print("✅ Model retrained using total_journey as target and saved as saved_model.pkl")
