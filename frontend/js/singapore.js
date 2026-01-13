// Configuration
const API_BASE = "http://localhost:8000";

// Load bus list on page load
async function loadBusList() {
  const url = `${API_BASE}/bus/singapore/list`;
  const select = document.getElementById("busSelect");
  
  // Show loading state
  select.innerHTML = "<option>Loading buses...</option>";

  try {
    console.log("Fetching bus list from:", url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Bus list received:", data);
    
    // Clear and populate dropdown
    select.innerHTML = "";
    
    if (!data.buses || data.buses.length === 0) {
      select.innerHTML = "<option>No buses available</option>";
      return;
    }

    data.buses.forEach((bus) => {
      const option = document.createElement("option");
      option.value = bus;
      option.textContent = bus;
      select.appendChild(option);
    });
    
    console.log(`Loaded ${data.buses.length} buses`);
  } catch (err) {
    console.error("Failed to load buses:", err);
    select.innerHTML = "<option>Error loading buses</option>";
    
    // Show error to user
    document.getElementById("resultdiv").innerHTML = `
      <div style="color: red; padding: 10px; border: 1px solid red; border-radius: 4px;">
        <b>⚠️ Error loading bus list:</b><br>
        ${err.message}<br><br>
        <small>Make sure the API is running at ${API_BASE}</small>
      </div>
    `;
  }
}

// Predict trip
async function predictTrip() {
  const busId = document.getElementById("busSelect").value;
  const startStop = document.getElementById("startStop").value;
  const endStop = document.getElementById("endStop").value;
  const resultDiv = document.getElementById("resultdiv");

  // Validation
  if (!busId || busId === "Loading buses..." || busId === "Error loading buses" || busId === "No buses available") {
    resultDiv.innerHTML = `<div style="color: red;">⚠️ Please select a valid bus</div>`;
    return;
  }

  if (parseInt(startStop) >= parseInt(endStop)) {
    resultDiv.innerHTML = `<div style="color: red;">⚠️ Start stop must be less than end stop</div>`;
    return;
  }

  const apiUrl = `${API_BASE}/bus/singapore/${busId}/predict_trip_range?start_stop=${startStop}&end_stop=${endStop}`;
  
  console.log("Fetching prediction from:", apiUrl);
  resultDiv.innerHTML = "<b>Loading prediction...</b>";

  try {
    const response = await fetch(apiUrl);
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Prediction data:", data);

    // Check if there's a message (no predictions)
    if (data.message) {
      resultDiv.innerHTML = `
        <div style="color: orange; padding: 10px; border: 1px solid orange; border-radius: 4px;">
          <b>ℹ️ ${data.message}</b>
        </div>
      `;
      return;
    }

    // Check if predictions exist
    if (!data.next_service || !data.next_service.predictions || data.next_service.predictions.length === 0) {
      resultDiv.innerHTML = `
        <div style="color: orange;">
          <b>No prediction data available for this route</b>
        </div>
      `;
      return;
    }

    // Build predictions table
    const predictions = data.next_service.predictions
      .map(
        (p) => `
        <tr>
          <td>${p.current_stop}</td>
          <td>${p.next_stop}</td>
          <td>${p.predicted_time}</td>
          <td>${p.crowd || 'N/A'}</td>
          <td>${p.traffic || 'N/A'}</td>
          <td>${p.user_experience || 'N/A'}</td>
        </tr>`
      )
      .join("");

    resultDiv.innerHTML = `
      <h3>🚌 Bus ${data.bus}</h3>
      <p><b>Time:</b> ${data.current_time}</p>
      <p><b>Route:</b> ${data.range_prediction.from_stop} → ${data.range_prediction.to_stop}</p>
      <p><b>Arrival at Start:</b> ${data.range_prediction.arrival_at_start}</p>
      <p><b>Arrival at End:</b> ${data.range_prediction.arrival_at_end}</p>
      
      <h4>Stop-by-Stop Predictions:</h4>
      <table border="1" cellspacing="0" cellpadding="8" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th>Current Stop</th>
            <th>Next Stop</th>
            <th>Predicted Time</th>
            <th>Crowd</th>
            <th>Traffic</th>
            <th>User Exp.</th>
          </tr>
        </thead>
        <tbody>
          ${predictions}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error("Prediction error:", err);
    resultDiv.innerHTML = `
      <div style="color: red; padding: 10px; border: 1px solid red; border-radius: 4px;">
        <b>❌ Error:</b><br>
        ${err.message}<br><br>
        <small>Check the browser console (F12) for more details</small>
      </div>
    `;
  }
}

// Initialize when page loads
window.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded, initializing...");
  loadBusList();
});

// Make function available globally
window.predictTrip = predictTrip;