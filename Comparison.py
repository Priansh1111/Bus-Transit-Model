import pandas as pd
import pickle
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.linear_model import LinearRegression

# -----------------------------------
# Load model and encoders
# -----------------------------------
with open("saved_model.pkl", "rb") as f:
    data = pickle.load(f)

model = data["model"]
le_crowd = data["le_crowd"]
le_traffic = data["le_traffic"]
le_user_exp = data["le_user_exp"]

# -----------------------------------
# Load datasets
# -----------------------------------
df_sg = pd.read_csv(r"C:\Users\shett\OneDrive\Desktop\backend\bus_dataset_singapore.csv")
df_mumbai = pd.read_csv(r"C:\Users\shett\OneDrive\Desktop\backend\bus_dataset_mumbai.csv")

# -----------------------------------
# Detect target column automatically
# -----------------------------------
def get_target_column(df):
    possible_targets = ["travel_time", "total_journey", "duration", "time", "journey_time"]
    for col in possible_targets:
        if col in df.columns:
            return col
    raise ValueError("No valid target column found in dataset. Please specify manually.")

target_col = get_target_column(df_sg)

# -----------------------------------
# Encode categorical features
# -----------------------------------
def encode_features(df):
    df = df.copy()
    df["crowd_encoded"] = le_crowd.transform(df["crowd"])
    df["traffic_encoded"] = le_traffic.transform(df["traffic"])
    df["user_exp_encoded"] = le_user_exp.transform(df["user_experience"])
    return df

df_sg = encode_features(df_sg)
df_mumbai = encode_features(df_mumbai)

# -----------------------------------
# Prepare features and targets (include dummy prev_travel_time)
# -----------------------------------
X_sg = df_sg[["crowd_encoded", "traffic_encoded", "user_exp_encoded"]].copy()
X_sg.insert(0, "prev_travel_time", 0)
y_sg = df_sg[target_col]

X_mumbai = df_mumbai[["crowd_encoded", "traffic_encoded", "user_exp_encoded"]].copy()
X_mumbai.insert(0, "prev_travel_time", 0)
y_mumbai = df_mumbai[target_col]

# -----------------------------------
# Predictions
# -----------------------------------
y_pred_sg = model.predict(X_sg)
y_pred_mumbai = model.predict(X_mumbai)

# -----------------------------------
# Evaluate performance
# -----------------------------------
mae_sg = mean_absolute_error(y_sg, y_pred_sg)
r2_sg = r2_score(y_sg, y_pred_sg)
mae_mumbai = mean_absolute_error(y_mumbai, y_pred_mumbai)
r2_mumbai = r2_score(y_mumbai, y_pred_mumbai)

print("----- Model Performance Comparison -----")
print(f"Singapore - MAE: {mae_sg:.2f}, R²: {r2_sg:.2f}")
print(f"Mumbai     - MAE: {mae_mumbai:.2f}, R²: {r2_mumbai:.2f}")
print("----------------------------------------")

# -----------------------------------
# Function: Plot Actual vs Predicted with Best-Fit Line
# -----------------------------------
def plot_actual_vs_predicted(actual, predicted, city_name, color, r2):
    sns.scatterplot(x=actual, y=predicted, color=color, alpha=0.6, label="Predicted Points")

    # Add regression line
    reg = LinearRegression().fit(np.array(actual).reshape(-1, 1), predicted)
    x_line = np.linspace(actual.min(), actual.max(), 100)
    y_line = reg.predict(x_line.reshape(-1, 1))
    plt.plot(x_line, y_line, color="black", linewidth=2, label="Best Fit Line")

    # Ideal line (y = x)
    plt.plot(x_line, x_line, color="red", linestyle="--", label="Ideal Line (y=x)")

    plt.xlabel("Actual Total Journey (mins)")
    plt.ylabel("Predicted Total Journey (mins)")
    plt.title(f"{city_name} (R² = {r2:.2f})")
    plt.legend()

# -----------------------------------
# Visualization: Actual vs Predicted (with Best-Fit Lines)
# -----------------------------------
plt.figure(figsize=(12, 5))
plt.suptitle("Model Performance: Singapore vs Mumbai", fontsize=15, fontweight="bold")

plt.subplot(1, 2, 1)
plot_actual_vs_predicted(y_sg, y_pred_sg, "Singapore", "green", r2_sg)

plt.subplot(1, 2, 2)
plot_actual_vs_predicted(y_mumbai, y_pred_mumbai, "Mumbai", "orange", r2_mumbai)

plt.tight_layout(rect=[0, 0, 1, 0.95])
plt.show()

# -----------------------------------
# Visualization: MAE Comparison
# -----------------------------------
plt.figure(figsize=(6, 4))
sns.barplot(
    x=["Singapore", "Mumbai"],
    y=[mae_sg, mae_mumbai],
    palette=["green", "orange"]
)
plt.title("Mean Absolute Error Comparison")
plt.ylabel("MAE (minutes)")
plt.show()

# -----------------------------------
# Save predictions for further analysis
# -----------------------------------
results_sg = pd.DataFrame({"actual": y_sg, "predicted": y_pred_sg})
results_mumbai = pd.DataFrame({"actual": y_mumbai, "predicted": y_pred_mumbai})
results_sg.to_csv("predictions_singapore.csv", index=False)
results_mumbai.to_csv("predictions_mumbai.csv", index=False)

print("Predictions saved as CSV for further analysis.")
