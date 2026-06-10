# 🌾 AGRO-LINK: AI-Powered Smart Agriculture Marketplace & Command Center

AGRO-LINK is an advanced, decentralized agri-commerce and agricultural intelligence platform that connects Farmers, Crop Dealers, and Input Shopkeepers. By leveraging a multi-agent AI framework, real-time IoT soil telemetry simulations, visual crop pathology scanning, and localized meteorological advisories, AGRO-LINK empowers farmers to make high-yield decisions, list verified crops, negotiate fair bids, and automate dispatch logistics.

---

## 🌟 Core Feature Modules

### 1. 🤖 AI Multi-Agent Alliance & Command Center
An integrated operations desk that triggers 4 specialized AI Agents running sequentially to analyze, price, broker, and schedule shipping for harvests in a single transaction loop:
*   **Agent 1: Pathology Diagnostic Agent:** Classifies crop leaf photos, estimates infection severity, and prescribes cure treatments.
*   **Agent 2: Market Intelligence Agent:** Analyzes mandi pricing trends using Ridge regression models and advises whether to *Sell* or *Hold*.
*   **Agent 3: Matchmaking Broker Agent:** Ranks nearby registered dealers based on proximity (Haversine), ratings, trust scores, and bid offers to select the best commercial buyer.
*   **Agent 4: Dispatch Logistics Agent:** Calculates mileage, selects the best shipping vehicle (e.g. mini-truck), estimates travel time, and computes freight costs.
*   *Outputs a consolidated Unified Agriculture Commerce Report.*

### 2. 📸 AI Auto-Listing Assistant
Allows farmers to upload a picture of their harvest. The system automatically:
*   Identifies the crop name (e.g. basmati rice, organic wheat).
*   Determines the quality grade (Grade A/B/C).
*   Recommends a competitive base price.
*   Generates a professional listing description and auto-fills the marketplace form.

### 3. 🍂 AI Crop Health & Pathology Management
Detects fungal anomalies (e.g. Rust, Blight) from leaf uploads. Provides detailed symptomatic lists, recommended chemical/organic treatments, estimated medicine costs, and maps nearby registered shopkeepers selling the required inputs within 50 km.

### 4. 🌤️ Geolocated AI Weather Advisor
*   Uses browser **Geolocation APIs** to detect the farmer's physical coordinates.
*   Integrates the **OpenStreetMap Nominatim API** to reverse-geocode coordinates into readable village/state names.
*   Fetches live meteorological updates and a 7-day forecast from **Open-Meteo**.
*   Synthesizes specific farming rules (delaying watering during rain, postponing sprays during high winds) using the Python AI Microservice.
*   Reactivates the **Fungal Spore Outbreak Radar** based on ambient telemetry.

### 5. 💰 AI Negotiation Assistant & Bidding Room
*   Analyzes dealer bids against current mandi rates, calculates profit margins, evaluates risk profiles, and suggests counter-offer targets.
*   Offers an interactive live chat room for bidding and deal finalization.

### 6. 🌱 IoT Soil Telemetry Deck
Renders circular progress dials displaying Moisture, Temperature, and Soil pH. Interactive sliders allow testing different soil states, which automatically recalculate crop-specific biological advisories.

### 7. 🗣️ Voice Assistant & Multilingual Support
*   Includes a voice-guided assistant (with an active waveform visualizer) that responds to commands like *"go to AI hub"*, *"check prices"*, or *"set Hindi"*.
*   Full translation matrices in **English (EN)**, **Hindi (HI)**, and **Marathi (MR)**.

---

## 🛠️ Technical Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React, Vite, Lucide Icons, Glassmorphism Styling |
| **Backend Gateway** | Node.js, Express, MongoDB (Mongoose), Socket.io |
| **AI Microservice** | Python, Flask, NumPy, Pandas, Scikit-learn (Ridge Regression), Pillow (PIL) |
| **APIs Used** | Open-Meteo Weather API, OpenStreetMap Nominatim reverse geocoder |
| **Deployment** | Docker, Docker Compose |

---

## 📁 Repository Structure

```
AGROLINK_FINAL/
├── ai_microservice/       # Python Flask ML & Expert Advisory service
│   ├── app.py             # Main Flask app routing and model logic
│   └── requirements.txt   # Python dependency library list
├── backend/               # Node.js API Gateway & socket handler
│   ├── controllers/       # Route controllers (auth, market, weather, agents)
│   ├── models/            # MongoDB Schemas (users, produce, weather logs)
│   ├── routes/            # Express route maps
│   ├── services/          # Orchestrators (Command Center service)
│   └── server.js          # App entrypoint
├── frontend/              # React single-page dashboard
│   ├── src/
│   │   ├── components/    # Reusable layouts (workflow bars, diagnostics cards)
│   │   ├── context/       # Auth & Language Context translation dictionary
│   │   ├── pages/         # View dashboards (Dashboard, AI Hub, WeatherAdvisor)
│   │   └── App.jsx        # Routing configuration
└── docker-compose.yml     # Multi-container orchestration config
```

---

## 🚀 Installation & Local Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Python](https://www.python.org/) (v3.9 or higher)
*   [MongoDB](https://www.mongodb.com/try/download/community) (running locally on `mongodb://127.0.0.1:27017`)

### Step 1: Clone and Initialize Git
```bash
git clone https://github.com/piyushg01/AGROLINK.git
cd AGROLINK
```

### Step 2: Set Up Backend Gateway
1. Navigate to the backend folder:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file inside `backend/` and configure:
   ```env
   PORT=8000
   MONGO_URI=mongodb://127.0.0.1:27017/agrolink
   JWT_SECRET=your_jwt_secret_key_here
   ```
3. Seed the database (creates demo farmers, shopkeepers, dealers, and listings):
   ```bash
   node seed.js
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Step 3: Set Up AI Microservice
1. Open a new terminal and navigate to the microservice folder:
   ```bash
   cd ai_microservice
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask service (runs on port 5000):
   ```bash
   python app.py
   ```

### Step 4: Set Up Frontend React
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite server:
   ```bash
   npm run dev
   ```
3. Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🐳 Running with Docker
You can run the entire stack (Node, React, Python Flask, and MongoDB) in single-container virtual environments using Docker Compose:

1. Ensure Docker Desktop is running.
2. In the root directory, run:
   ```bash
   docker-compose up --build
   ```
3. Access the React app at `http://localhost:5173`.

---

## 🧪 Running Integration Tests
To verify all core API connections, database CRUD actions, and AI pipeline orchestration, run the automated integration tests in the backend terminal:
```bash
# Verify Weather Advisor integration
node scratch/test_weather_advisor.js

# Verify AI Command Center pipeline
node scratch/test_ai_command.js

# Verify Multi-Agent coordination
node scratch/test_multi_agent.js
```
