#Smart Bus Transit System

AI-powered bus transit prediction and comparison dashboard. This project provides a FastAPI backend for bus ETA predictions and a simple frontend UI to explore Singapore routes and compare results with Mumbai.
https://github.com/Priansh1111/Bus-Transit-Model/blob/master/README.md
## Features
- Predict stop-to-stop travel times for a selected bus and route segment
- View crowd, traffic, and user experience context with each prediction
- Compare model performance between Singapore and Mumbai
- Simple frontend pages for predictions and comparison charts

## Tech Stack
- Backend: FastAPI, Pandas, scikit-learn
- Frontend: HTML, CSS, JavaScript, Chart.js

## Project Structure
- `main.py` - FastAPI app and prediction endpoints
- `model.py` - Train and save the ML model
- `Comparison.py` - Model evaluation and plots
- `frontend/` - Static UI

## Setup
1. Create a virtual environment (optional but recommended)
2. Install dependencies:

```
pip install -r requirements.txt
```

## Required Data Files
Place these files in the repo root:
- `bus_dataset_singapore.csv`
- `bus_dataset_mumbai.csv`

If you already have `saved_model.pkl`, the API will load it. Otherwise, it falls back to mock predictions.

## Run the API
```
uvicorn main:app --reload
```

API runs at `http://localhost:8000`.

## Frontend
Open `frontend/index.html` in your browser.

The UI expects the API to be running at `http://localhost:8000`.

## API Endpoints
- `GET /` - health message
- `GET /health` - status check
- `GET /bus/{city}/list` - list available buses for a city
- `GET /bus/{city}/{bus_id}/predict_trip_range?start_stop=1&end_stop=5` - stop range prediction

Example:
```
curl "http://localhost:8000/bus/singapore/12/predict_trip_range?start_stop=1&end_stop=5"
```

## Training the Model
To retrain and save the model:
```
python model.py
```

This regenerates `saved_model.pkl` using the Singapore dataset.

## Evaluation
Run the comparison script to generate charts and CSVs:
```
python Comparison.py
```

Outputs:
- `predictions_singapore.csv`
- `predictions_mumbai.csv`

## Screenshots
### Singapore Predictions UI
[Singapore Bus ETA Predictions]
<img width="1919" height="912" alt="image" src="https://github.com/user-attachments/assets/498e188b-a5b3-4405-b9d3-5615755efa64" />


### Model Performance Comparison
[Model Performance: Singapore vs Mumbai]
<img width="1196" height="562" alt="image" src="https://github.com/user-attachments/assets/d2152dc7-9587-471c-a666-69ecadc4e2a3" />


## License
Add a license if you plan to share or distribute this project.
