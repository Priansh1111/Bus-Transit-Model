const BACKEND_URL = "http://127.0.0.1:8000";

async function loadCharts() {
  // Fetch comparison data
  const resp = await fetch(`${BACKEND_URL}/bus/mumbai/metrics?bus_id=1&city=mumbai`);
  const data = await resp.json();

  // Accuracy Chart
  new Chart(document.getElementById('accuracyChart'), {
    type: 'bar',
    data: {
      labels: ['Singapore', 'Mumbai'],
      datasets: [{
        label: 'Prediction Accuracy (%)',
        data: [data.singapore_accuracy, data.mumbai_accuracy],
      }]
    }
  });

  // Crowd Chart
  new Chart(document.getElementById('crowdChart'), {
    type: 'line',
    data: {
      labels: data.bus_services,
      datasets: [{
        label: 'Crowd Singapore',
        data: data.crowd_sg
      }, {
        label: 'Crowd Mumbai',
        data: data.crowd_mum
      }]
    }
  });
}

loadCharts();

// --------------------------------------------------
// Load predictions CSVs and draw Actual vs Predicted
// --------------------------------------------------
async function loadActualPredChart() {
  // helper to fetch and parse a simple CSV with headers 'actual' and 'predicted'
  async function fetchPredCsv(path) {
    try {
      const r = await fetch(path);
      if (!r.ok) throw new Error(`${path} fetch failed: ${r.status}`);
      const txt = await r.text();
      const lines = txt.trim().split(/\r?\n/);
      const hdr = lines[0].split(",").map(h => h.trim());
      const actualIdx = hdr.indexOf('actual');
      const predIdx = hdr.indexOf('predicted');
      const points = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',');
        const a = parseFloat(cols[actualIdx]);
        const p = parseFloat(cols[predIdx]);
        if (!isNaN(a) && !isNaN(p)) points.push({ x: a, y: p });
      }
      return points;
    } catch (err) {
      console.error('Failed to load CSV', path, err);
      return [];
    }
  }

  // compute linear fit (slope, intercept) for points array [{x,y},...]
  function linearFit(points) {
    if (!points.length) return { slope: 0, intercept: 0 };
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    const n = points.length;
    for (const pt of points) {
      sx += pt.x;
      sy += pt.y;
      sxx += pt.x * pt.x;
      sxy += pt.x * pt.y;
    }
    const meanX = sx / n;
    const meanY = sy / n;
    const denom = sxx - n * meanX * meanX;
    if (Math.abs(denom) < 1e-12) return { slope: 0, intercept: meanY };
    const slope = (sxy - n * meanX * meanY) / denom;
    const intercept = meanY - slope * meanX;
    return { slope, intercept };
  }

  // try relative-to-root paths; adjust if your server serves static files from a different prefix
  const sgPoints = await fetchPredCsv('/predictions_singapore.csv');
  const mumPoints = await fetchPredCsv('/predictions_mumbai.csv');

  // determine x range
  const allX = [...sgPoints, ...mumPoints].map(p => p.x);
  const xMin = allX.length ? Math.min(...allX) : 0;
  const xMax = allX.length ? Math.max(...allX) : 1;

  const sgFit = linearFit(sgPoints);
  const mumFit = linearFit(mumPoints);

  const sgLine = [
    { x: xMin, y: sgFit.intercept + sgFit.slope * xMin },
    { x: xMax, y: sgFit.intercept + sgFit.slope * xMax }
  ];
  const mumLine = [
    { x: xMin, y: mumFit.intercept + mumFit.slope * xMin },
    { x: xMax, y: mumFit.intercept + mumFit.slope * xMax }
  ];

  // ideal line y=x
  const idealLine = [{ x: xMin, y: xMin }, { x: xMax, y: xMax }];

  const ctx = document.getElementById('actualPredChart').getContext('2d');
  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: `Singapore (n=${sgPoints.length})`,
          data: sgPoints,
          backgroundColor: 'rgba(0,128,0,0.7)'
        },
        {
          label: `Mumbai (n=${mumPoints.length})`,
          data: mumPoints,
          backgroundColor: 'rgba(255,165,0,0.8)'
        },
        {
          label: 'Singapore Best Fit',
          data: sgLine,
          type: 'line',
          fill: false,
          borderColor: 'rgba(0,100,0,0.9)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0
        },
        {
          label: 'Mumbai Best Fit',
          data: mumLine,
          type: 'line',
          fill: false,
          borderColor: 'rgba(204,102,0,0.9)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0
        },
        {
          label: 'Ideal (y = x)',
          data: idealLine,
          type: 'line',
          borderColor: 'rgba(255,0,0,0.8)',
          borderDash: [6, 4],
          pointRadius: 0,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { title: { display: true, text: 'Actual (minutes)' } },
        y: { title: { display: true, text: 'Predicted (minutes)' } }
      }
    }
  });
}

// start the chart loader for the predictions plot (does not change previous behavior)
loadActualPredChart();
