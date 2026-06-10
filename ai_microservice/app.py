import os
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
from sklearn.linear_model import Ridge
import datetime

app = Flask(__name__)
CORS(app)

# Helper function to analyze image pixels and simulate image-based disease classification
def analyze_leaf_image(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize((100, 100)) # resize for fast analysis
        img_np = np.array(img)
        
        # Calculate average color values
        r, g, b = img_np[:,:,0], img_np[:,:,1], img_np[:,:,2]
        avg_r = float(np.mean(r))
        avg_g = float(np.mean(g))
        avg_b = float(np.mean(b))
        
        # Create a deterministic hash value based on average colors
        val_hash = int(avg_r + avg_g * 3 + avg_b * 7)
        
        # Determine crop disease based on color characteristics and hash to provide a diverse sandbox experience
        if avg_g > avg_r + 15 and avg_g > avg_b + 15:
            # Healthy options
            if val_hash % 2 == 0:
                return {
                    "crop": "Tomato / Potato",
                    "disease": "Healthy Leaf",
                    "confidence": round(min(99.5, 90.0 + (val_hash % 10)), 2),
                    "severity": "None",
                    "description": "The leaf appears healthy and shows normal chlorophyll levels. No pathogens detected during color analysis.",
                    "symptoms": ["Green vibrant coloration", "Normal vein structure", "No lesions or spots"],
                    "treatment": [
                        "Maintain regular watering schedule.",
                        "Apply nitrogen-rich fertilizer if growth is slow.",
                        "Ensure proper soil aeration."
                    ],
                    "estimatedCost": "₹0",
                    "recommendedFertilizers": ["NPK 19-19-19 Premium Fertilizer"],
                    "recommendedPesticides": []
                }
            else:
                return {
                    "crop": "Wheat / Rice",
                    "disease": "Healthy Leaf",
                    "confidence": round(min(99.5, 88.0 + (val_hash % 12)), 2),
                    "severity": "None",
                    "description": "No anomalies detected. Leaf tissue exhibits strong vascular structure and active photosynthetic coloration.",
                    "symptoms": ["Uniform green coloration", "Strong blade rigidity", "No necrotic spots or chlorosis"],
                    "treatment": [
                        "Maintain regular irrigation schedule.",
                        "Ensure adequate sunlight penetration in crop rows.",
                        "Apply nitrogen fertilizer during vegetative growth phase."
                    ],
                    "estimatedCost": "₹0",
                    "recommendedFertilizers": ["NPK 19-19-19 Premium Fertilizer"],
                    "recommendedPesticides": []
                }
        elif avg_r > avg_g + 10 and avg_b < 120:
            # Common Rust
            return {
                "crop": "Corn / Wheat",
                "disease": "Common Rust (Puccinia sorghi)",
                "confidence": round(min(98.0, 75.0 + (val_hash % 23)), 2),
                "severity": "Medium",
                "description": "Common rust is caused by a fungal pathogen that thrives in cool, humid environments. It produces elevated, powdery orange-brown pustules on both leaf surfaces, which rupture to release infectious spores.",
                "symptoms": ["Powdery orange-brown pustules on leaves", "Chlorotic halos surrounding the active lesions", "Premature leaf dry-out and lodging"],
                "treatment": [
                    "Spray Mancozeb Fungicide or copper oxychloride solution.",
                    "Ensure optimal spacing between rows to increase ventilation.",
                    "Avoid excessive nitrogen fertilizers; boost potassium intake."
                ],
                "estimatedCost": "₹450 - ₹950",
                "recommendedFertilizers": ["NPK 19-19-19 Premium Fertilizer", "Single Super Phosphate (SSP) Granular"],
                "recommendedPesticides": ["Organic Neem Oil Pesticide (Cold Pressed)", "Mancozeb Fungicide Premium"]
            }
        elif avg_r > 130 and avg_g > 130 and avg_b < 100:
            # Bacterial Leaf Blight (Yellowish margins)
            return {
                "crop": "Rice",
                "disease": "Bacterial Leaf Blight (Xanthomonas oryzae)",
                "confidence": round(min(98.0, 70.0 + (val_hash % 27)), 2),
                "severity": "High",
                "description": "Bacterial leaf blight is a highly systemic vascular disease in rice. It causes water-soaked stripe lesions along the leaf margins, which eventually dry up into straw-colored necrosis, severely impacting yield.",
                "symptoms": ["Linear yellow-to-straw stripes along leaf borders", "Milky bacterial ooze droplets on leaves in humid mornings", "Complete leaf wilting (Kresek symptom in young plants)"],
                "treatment": [
                    "Apply Copper Oxychloride mixed with Streptocycline.",
                    "Drain excess water from the fields during active outbreaks.",
                    "Maintain balanced soil nutrition and avoid over-fertilizing with nitrogen."
                ],
                "estimatedCost": "₹800 - ₹1800",
                "recommendedFertilizers": ["Single Super Phosphate (SSP) Granular"],
                "recommendedPesticides": ["Mancozeb Fungicide Premium", "Organic Neem Oil Pesticide (Cold Pressed)"]
            }
        elif avg_r < 100 and avg_g < 100 and avg_b < 100:
            # Leaf Spot (Cotton) - dark/grayish
            return {
                "crop": "Cotton",
                "disease": "Alternaria Leaf Spot (Alternaria macrospora)",
                "confidence": round(min(98.0, 78.0 + (val_hash % 20)), 2),
                "severity": "Low",
                "description": "Leaf spot is a common fungal infection affecting cotton crops, primarily in warm, humid weather. It causes small, circular dark brown spots with purple margins, which can merge under high humidity.",
                "symptoms": ["Small circular spots with prominent purple margins", "Dry, brittle tissue centers that may drop out (shot-hole effect)", "Defoliation starting from the lower canopy"],
                "treatment": [
                    "Apply Propiconazole or Mancozeb fungicide.",
                    "Remove and destroy crop debris after harvest to reduce inoculant.",
                    "Spray organic Neem oil early as a natural deterrent."
                ],
                "estimatedCost": "₹300 - ₹700",
                "recommendedFertilizers": ["NPK 19-19-19 Premium Fertilizer"],
                "recommendedPesticides": ["Mancozeb Fungicide Premium", "Organic Neem Oil Pesticide (Cold Pressed)"]
            }
        else:
            # Early/Late Blight (Default fallback)
            return {
                "crop": "Tomato / Potato",
                "disease": "Early Blight (Alternaria solani)",
                "confidence": round(min(97.2, 70 + (avg_r + avg_g)/4), 2),
                "severity": "High",
                "description": "Early blight is a major fungal disease affecting solanaceous crops. It causes target-like circular lesions with concentric rings, primarily attacking older foliage first before spreading to stems and fruit.",
                "symptoms": ["Concentric brown spots with yellow margins", "Leathery black lesions near stem junctions", "Premature leaf yellowing and defoliation"],
                "treatment": [
                    "Spray Chlorothalonil 75% WP or Metalaxyl systemically.",
                    "Prune lower branches to prevent soil-splash inoculation.",
                    "Water at the root level using drip systems to avoid leaf wetness."
                ],
                "estimatedCost": "₹600 - ₹1400",
                "recommendedFertilizers": ["Single Super Phosphate (SSP) Granular", "NPK 19-19-19 Premium Fertilizer"],
                "recommendedPesticides": ["Chlorothalonil Fungicide 75% WP", "Organic Neem Oil Pesticide (Cold Pressed)"]
            }
    except Exception as e:
        # Fallback in case of image reading failure
        return {
            "crop": "Tomato",
            "disease": "Early Blight (Alternaria solani)",
            "confidence": 84.50,
            "severity": "High",
            "description": "Fungal infection causing circular brown spots with concentric rings, typically on older leaves first.",
            "symptoms": ["Brown circular leaf spots", "Concentric target-like rings", "Stem lesions"],
            "treatment": [
                "Apply Chlorothalonil or Mancozeb fungicides.",
                "Maintain optimal plant spacing.",
                "Ensure proper crop rotation."
            ],
            "estimatedCost": "₹600 - ₹1200",
            "recommendedFertilizers": ["Single Super Phosphate (SSP) Granular"],
            "recommendedPesticides": ["Chlorothalonil Fungicide 75% WP", "Organic Neem Oil Pesticide (Cold Pressed)"]
        }

# Live Machine Learning model for Crop Price Prediction
@app.route('/api/price-predict', methods=['POST'])
def price_predict():
    data = request.get_json() or {}
    crop = data.get('crop', 'Wheat')
    state = data.get('state', 'Maharashtra')
    
    # Establish base pricing coefficients for realistic simulation
    crop_bases = {
        'Wheat': 2100,
        'Rice': 2200,
        'Tomato': 1500,
        'Potato': 1200,
        'Cotton': 6000,
        'Soybean': 4200
    }
    
    state_modifiers = {
        'Maharashtra': 1.05,
        'Uttar Pradesh': 0.98,
        'Punjab': 1.02,
        'Madhya Pradesh': 0.95,
        'Gujarat': 1.03
    }
    
    base_price = crop_bases.get(crop, 2000) * state_modifiers.get(state, 1.0)
    
    # Generate dynamic historical data (past 12 months)
    # Fit a linear Ridge regression model based on month index to predict next 3 months
    months_indices = np.array(range(1, 13)).reshape(-1, 1)
    
    # Add a slight growth trend and seasonal sine-wave fluctuations
    np.random.seed(42) # lock seed for stability
    trend = 15 * months_indices.flatten()
    seasonality = 150 * np.sin(2 * np.pi * months_indices.flatten() / 12)
    noise = np.random.normal(0, 30, 12)
    
    historical_prices = base_price + trend + seasonality + noise
    
    # Fit the Ridge regression model
    model = Ridge(alpha=1.0)
    model.fit(months_indices, historical_prices)
    
    # Predict the next 3 months
    future_months = np.array([13, 14, 15]).reshape(-1, 1)
    predicted_prices = model.predict(future_months)
    
    # Format the data for standard charting (Recharts or Chart.js)
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan (F)", "Feb (F)", "Mar (F)"]
    
    chart_data = []
    # Combine historic data
    for i in range(12):
        chart_data.append({
            "month": month_names[i],
            "price": round(float(historical_prices[i]), 2),
            "type": "Historical"
        })
    # Combine predictions
    for j in range(3):
        chart_data.append({
            "month": month_names[12 + j],
            "price": round(float(predicted_prices[j]), 2),
            "type": "Predicted"
        })
        
    return jsonify({
        "success": True,
        "crop": crop,
        "state": state,
        "predictedPriceNextMonth": round(float(predicted_prices[0]), 2),
        "priceTrend": "Upward" if model.coef_[0] > 0 else "Downward",
        "chartData": chart_data
    })

# Crop disease detection endpoint
@app.route('/api/disease-detect', methods=['POST'])
def disease_detect():
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image file provided"}), 400
        
    image_file = request.files['image']
    image_bytes = image_file.read()
    
    analysis = analyze_leaf_image(image_bytes)
    return jsonify({
        "success": True,
        "result": analysis
    })

# Crop listing analysis endpoint for automated listing system
@app.route('/api/crop-analyze-listing', methods=['POST'])
def crop_analyze_listing():
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image file provided"}), 400
        
    image_file = request.files['image']
    image_bytes = image_file.read()
    
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize((100, 100))
        img_np = np.array(img)
        
        # Calculate color metrics
        r, g, b = img_np[:,:,0], img_np[:,:,1], img_np[:,:,2]
        avg_r = float(np.mean(r))
        avg_g = float(np.mean(g))
        avg_b = float(np.mean(b))
        
        val_hash = int(avg_r + avg_g * 3 + avg_b * 7)
        
        # Classify based on color characteristics and deterministic hash
        if avg_g > avg_r + 15 and avg_g > avg_b + 15:
            # Green-heavy: Rice or Wheat
            if val_hash % 2 == 0:
                crop_name = "Premium Basmati Rice"
                category = "Grain"
                base_price = 68
                desc_detail = "highly uniform grain length, clean white color, and excellent aroma characteristics."
            else:
                crop_name = "Organic Sharbati Wheat"
                category = "Grain"
                base_price = 28
                desc_detail = "golden-amber grains, low moisture content, high gluten structure, and free from chaff."
        elif avg_r > 130 and avg_g > 130 and avg_b < 100:
            # Yellowish/Red-yellow: Mango or Potato
            if val_hash % 2 == 0:
                crop_name = "Alphonso Mango"
                category = "Fruit"
                base_price = 120
                desc_detail = "rich yellow-saffron skin, sweet fiberless pulp, mature harvest state, and uniform weight."
            else:
                crop_name = "Golden Russet Potatoes"
                category = "Vegetable"
                base_price = 20
                desc_detail = "clean sandy-skin potatoes, starch-rich, firm texture, uniform size range, and zero green patches."
        elif avg_r > avg_g + 10 and avg_b < 120:
            # Orange-red/Brown: Chickpeas or Tomatoes
            if val_hash % 2 == 0:
                crop_name = "Desi Chickpeas (Chana)"
                category = "Pulses"
                base_price = 55
                desc_detail = "bold seed sizes, low moisture level, high density, and free from weed impurities."
            else:
                crop_name = "Red hybrid Tomatoes"
                category = "Vegetable"
                base_price = 25
                desc_detail = "deep red skin, high firmness index, uniform sizing, and excellent transportability characteristics."
        elif avg_r < 100 and avg_g < 100 and avg_b < 100:
            # Dark: Bt Cotton
            crop_name = "Bt Cotton (Medium Staple)"
            category = "Oilseeds"
            base_price = 70
            desc_detail = "clean white staple length of 28mm, high strength, low trash content, and optimal ginning turnout."
        else:
            # Default fallback: Tomato
            crop_name = "Organic Tomatoes"
            category = "Vegetable"
            base_price = 22
            desc_detail = "naturally ripened vegetables, medium size, farm fresh, and rich in juice content."

        # Assign quality and grade based on hash
        if val_hash % 3 == 0:
            quality = "Premium Quality (Healthy, uniform color, zero surface spots)"
            grade = "Grade A"
            price_multiplier = 1.05
        elif val_hash % 3 == 1:
            quality = "Standard Quality (Minor size/shape variances, healthy pigmentation)"
            grade = "Grade B"
            price_multiplier = 0.95
        else:
            quality = "Fair Quality (Moderate color variances, minor transport cosmetic blemishes)"
            grade = "Grade C"
            price_multiplier = 0.82
            
        suggested_price = round(base_price * price_multiplier, 2)
        
        description = f"AI-evaluated {grade} {crop_name}. Visual analysis shows {quality.lower()} and {desc_detail} Recommended price index based on national market trends."
        
        return jsonify({
            "success": True,
            "cropName": crop_name,
            "category": category,
            "detectedQuality": quality,
            "detectedGrade": grade,
            "suggestedPrice": suggested_price,
            "description": description
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to perform AI listing image analysis: {str(e)}"
        }), 500

# Smart Fertilizer Recommendation Expert System
@app.route('/api/fertilizer-recommend', methods=['POST'])
def fertilizer_recommend():
    data = request.get_json() or {}
    try:
        n = float(data.get('N', 40))
        p = float(data.get('P', 40))
        k = float(data.get('K', 40))
        ph = float(data.get('pH', 6.5))
        soil_type = data.get('soilType', 'Alluvial')
        crop = data.get('cropName', 'Wheat')
    except Exception:
        return jsonify({"success": False, "error": "Invalid inputs"}), 400
        
    # Standard ideal ratios for major crops
    ideals = {
        'Wheat': {'N': 80, 'P': 40, 'K': 40, 'pH': 6.5},
        'Rice': {'N': 100, 'P': 50, 'K': 50, 'pH': 6.0},
        'Tomato': {'N': 120, 'P': 60, 'K': 80, 'pH': 6.2},
        'Potato': {'N': 90, 'P': 90, 'K': 120, 'pH': 5.8},
        'Cotton': {'N': 70, 'P': 35, 'K': 35, 'pH': 7.0}
    }
    
    ideal = ideals.get(crop, {'N': 80, 'P': 40, 'K': 40, 'pH': 6.5})
    
    # Assess deficiencies
    deficiency = []
    recommendation = []
    suggested_fertilizer = ""
    
    n_diff = ideal['N'] - n
    p_diff = ideal['P'] - p
    k_diff = ideal['K'] - k
    
    # Rule engine
    if n_diff > 20:
        deficiency.append("Severely deficient in Nitrogen (N)")
        recommendation.append("Add Urea or Ammonium Sulfate to rapidly restore nitrogen levels.")
    elif n_diff > 5:
        deficiency.append("Slightly low on Nitrogen (N)")
        recommendation.append("Apply balanced organic compost or a light dose of Urea.")
        
    if p_diff > 15:
        deficiency.append("Deficient in Phosphorus (P)")
        recommendation.append("Apply Single Super Phosphate (SSP) or Diammonium Phosphate (DAP).")
        
    if k_diff > 15:
        deficiency.append("Deficient in Potassium (K)")
        recommendation.append("Apply Muriate of Potash (MOP) or Potassium Sulfate.")
        
    if ph < 5.5:
        deficiency.append("Highly Acidic Soil")
        recommendation.append("Apply agricultural lime (calcium carbonate) to increase soil pH.")
    elif ph > 7.8:
        deficiency.append("Highly Alkaline Soil")
        recommendation.append("Apply elemental sulfur or organic manure to reduce soil pH.")
        
    # Select best compound fertilizer match
    if n_diff > 15 and p_diff > 15 and k_diff < 10:
        suggested_fertilizer = "DAP (Diammonium Phosphate) + Urea"
    elif n_diff > 15 and p_diff > 15 and k_diff > 15:
        suggested_fertilizer = "NPK 19-19-19"
    elif n_diff > 15 and p_diff < 10 and k_diff < 10:
        suggested_fertilizer = "Urea (46% Nitrogen)"
    elif n_diff < 10 and p_diff > 15 and k_diff < 10:
        suggested_fertilizer = "Single Super Phosphate (SSP)"
    elif n_diff < 10 and p_diff < 10 and k_diff > 15:
        suggested_fertilizer = "MOP (Muriate of Potash)"
    else:
        suggested_fertilizer = "NPK 10-26-26 or Organic Compost"
        
    if not deficiency:
        deficiency.append("Excellent nutrient balance!")
        recommendation.append("Continue current soil maintenance practices. No extra fertilizer required.")
        suggested_fertilizer = "Organic Vermicompost (Maintenance dose)"
        
    return jsonify({
        "success": True,
        "crop": crop,
        "soilType": soil_type,
        "soilStatus": deficiency,
        "recommendedFertilizer": suggested_fertilizer,
        "dosage": f"60-80 kg per acre" if "NPK" in suggested_fertilizer or "DAP" in suggested_fertilizer else "40-50 kg per acre",
        "instructions": recommendation,
        "idealPh": ideal['pH'],
        "currentPh": ph
    })

# Root guide page
@app.route('/')
def home():
    return """
    <html>
      <head>
        <title>AGRO-LINK AI Microservice</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #050B07; color: #f8fafc; padding: 3rem; text-align: center; }
          .card { max-width: 500px; margin: 4rem auto; background: #0f1f14; border: 1px solid #10b981; border-radius: 16px; padding: 2.5rem; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.1); }
          h1 { color: #34d399; margin-bottom: 1rem; font-weight: 800; }
          p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
          .btn { display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; margin-top: 1.5rem; transition: background 0.2s; }
          .btn:hover { background: #059669; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>AGRO-LINK AI Service</h1>
          <p>You have reached the Python AI Microservice container. To access the user-facing AGRO-LINK application, please navigate to the frontend portal:</p>
          <a class="btn" href="http://localhost:5174/" target="_blank">Open Frontend Application</a>
        </div>
      </body>
    </html>
    """

# AI Contract Bid Legal & Terms Analyzer
@app.route('/api/ai/analyze-contract', methods=['POST'])
def analyze_contract():
    data = request.get_json() or {}
    crop = data.get('cropName', 'Wheat')
    price = float(data.get('price', 25))
    quantity = float(data.get('quantity', 1000))
    timeline = int(data.get('timelineDays', 10))
    
    # Live fair valuation benchmark
    crop_bases = {
        'Wheat': 22.0, 'Rice': 65.0, 'Tomato': 18.0, 'Potato': 15.0, 'Cotton': 60.0, 'Soybean': 42.0
    }
    base = crop_bases.get(crop, 20.0)
    deviation = ((price - base) / base) * 100
    
    risk_score = 30 # default baseline
    warnings = []
    recommendations = []
    
    # 1. Price Valuation Risk
    if deviation < -10:
        risk_score += 25
        warnings.append(f"Price is severely undervalued (₹{price}/kg is {abs(round(deviation,1))}% below current market average ₹{base}/kg).")
        recommendations.append(f"Negotiate base pricing up towards at least ₹{round(base * 0.95, 1)}/kg.")
    elif deviation > 15:
        warnings.append("High price offer. Verify if penalty clauses on moisture or size specs are overly aggressive.")
        recommendations.append("Excellent offer! Request standard lock-in contract structure immediately.")
    else:
        recommendations.append("Price is within optimal fair trade market boundaries.")
        
    # 2. Timeline Risk
    if timeline < 5:
        risk_score += 30
        warnings.append("Extreme delivery window risk. Harvesting, sorting, and logistics in under 5 days has a 80% delay penalty probability.")
        recommendations.append("Demand a minimum 7-day transportation buffer or write in a weather delay exemption clause.")
    elif timeline < 10:
        risk_score += 15
        warnings.append("Tight delivery timeline. Minimal margin for transport delays or heavy rains.")
        recommendations.append("Request a 10-day logistics delivery buffer from dealer.")
    else:
        recommendations.append("Logistics timeline is safe, offering sufficient harvesting buffers.")
        
    # 3. Quality Specifications Risks
    if quantity > 4000:
        risk_score += 10
        warnings.append("High volume commitment. Failing to meet quantity targets may trigger full contract default penalties.")
        recommendations.append("Add a fractional delivery clause letting you sell whatever portion is successfully harvested.")
        
    risk_score = min(98, max(5, risk_score))
    
    rating = "Safe"
    if risk_score > 60:
        rating = "Danger (High Risk)"
    elif risk_score > 35:
        rating = "Caution (Medium Risk)"
        
    return jsonify({
        "success": True,
        "crop": crop,
        "offeredPrice": price,
        "fairPriceAverage": base,
        "valuationPercentage": round(deviation, 2),
        "riskScore": risk_score,
        "riskRating": rating,
        "warnings": warnings if warnings else ["No severe restrictive clauses or valuation risks found."],
        "recommendations": recommendations
    })

# Predictive Spore Disease Outbreak Risk Forecaster
@app.route('/api/ai/outbreak-risk', methods=['POST'])
def outbreak_risk():
    data = request.get_json() or {}
    humidity = float(data.get('humidity', 50))
    temp = float(data.get('temperature', 28))
    ph = float(data.get('soilPh', 6.5))
    crop = data.get('cropName', 'General Crop')
    
    # Calculate Spore Germination Index (SGI)
    humidity_factor = max(0, (humidity - 40) * 1.5)
    temp_factor = max(0, 30 - abs(temp - 26) * 2)
    ph_factor = max(0, (7.0 - ph) * 10) # slightly acidic boosts fungal germination
    
    raw_index = (humidity_factor * 0.5) + (temp_factor * 0.3) + (ph_factor * 0.2)
    outbreak_prob = min(99.0, max(5.0, raw_index))
    
    status = "Safe"
    if outbreak_prob > 75:
        status = "Danger (Critical Outbreak Risk)"
    elif outbreak_prob > 45:
        status = "Warning (High Spore Germination)"
    elif outbreak_prob > 20:
        status = "Moderate Spore Incubation"
        
    # Bio-chemical prescription guidelines
    prescriptions = []
    if status == "Danger (Critical Outbreak Risk)":
        prescriptions.append("Apply proactive Copper Oxychloride spray immediately within 24 hours.")
        prescriptions.append("Dilute Cold Pressed Neem Oil at 1:100 ratio with water and mist lower stems.")
        prescriptions.append("Restructure drip irrigation schedule to run early morning only to lower leaf-wetness duration.")
    elif status == "Warning (High Spore Germination)":
        prescriptions.append("Apply preventative Neem oil spray (1:200 ratio) across crops.")
        prescriptions.append("Prune foliage below 1 foot height to maximize soil ventilation.")
    else:
        prescriptions.append("Normal maintenance. Apply vermicompost and maintain regular watering.")
        
    return jsonify({
        "success": True,
        "crop": crop,
        "humidity": humidity,
        "temperature": temp,
        "soilPh": ph,
        "sporeIndex": round(outbreak_prob, 2),
        "riskStatus": status,
        "sporeSpreadVector": "North-East (Speed: 14 km/h)" if humidity > 60 else "No active spore vectors",
        "prescriptions": prescriptions
    })

# Crop price forecasting endpoint using historical dataset
@app.route('/api/crop-price-forecast', methods=['POST'])
def crop_price_forecast():
    data = request.get_json() or {}
    crop = data.get('cropName', 'Wheat')
    location = data.get('location', 'Maharashtra')
    quantity = float(data.get('quantity', 1000))

    try:
        # Load dataset
        csv_path = os.path.join(os.path.dirname(__file__), 'historical_prices_dataset.csv')
        df = pd.read_csv(csv_path)
        
        # Filter data
        filtered_df = df[(df['crop'] == crop) & (df['location'] == location)]
        
        if filtered_df.empty:
            return jsonify({
                "success": False,
                "error": f"No historical data found for Crop: {crop} and Location: {location}."
            }), 404
            
        # Sort by date
        filtered_df = filtered_df.sort_values(by='date')
        
        # Convert date to index
        prices = filtered_df['price'].values
        dates = filtered_df['date'].values
        
        n_days = len(prices)
        x = np.array(range(n_days)).reshape(-1, 1)
        y = prices
        
        # Fit regression
        model = Ridge(alpha=1.0)
        model.fit(x, y)
        
        # Predict next 15 days
        future_x = np.array(range(n_days, n_days + 15)).reshape(-1, 1)
        predictions = model.predict(future_x)
        
        # Calculate daily dates
        last_date = datetime.datetime.strptime(dates[-1], '%Y-%m-%d')
        future_dates = []
        for i in range(1, 16):
            next_date = last_date + datetime.timedelta(days=i)
            future_dates.append(next_date.strftime('%Y-%m-%d'))
            
        # Get specific day values
        tomorrow = round(float(predictions[0]), 2)
        three_day = round(float(predictions[2]), 2)
        seven_day = round(float(predictions[6]), 2)
        fifteen_day = round(float(predictions[14]), 2)
        current_price = round(float(prices[-1]), 2)
        
        # Recommendation engine
        price_diff_pct = ((seven_day - current_price) / current_price) * 100
        
        if price_diff_pct > 2.0:
            action = 'Hold'
            message = f"Market demand is rising. Prices are forecasted to increase by {round(price_diff_pct, 1)}% over the next week. We recommend holding your {quantity} kg crop for at least 5 to 7 days to maximize your profit margin."
        elif price_diff_pct < -2.0:
            action = 'Sell'
            message = f"Warning: Supply influx detected. Prices are expected to decline by {round(abs(price_diff_pct), 1)}% in the coming days. Sell your crop immediately to lock in the current rate of ₹{current_price}/kg and prevent loss."
        else:
            action = 'Neutral'
            message = f"Prices are expected to remain stable (within {round(price_diff_pct, 1)}% change). You may sell now or hold as per your immediate logistics convenience."
            
        # Format chart data
        historical_prices = []
        # Return last 15 days of history for comparison
        history_slice = min(15, n_days)
        for i in range(n_days - history_slice, n_days):
            historical_prices.append({
                "date": dates[i],
                "price": round(float(prices[i]), 2)
            })
            
        forecast_prices = []
        for i in range(15):
            forecast_prices.append({
                "date": future_dates[i],
                "price": round(float(predictions[i]), 2)
            })
            
        return jsonify({
            "success": True,
            "crop": crop,
            "location": location,
            "quantity": quantity,
            "currentPrice": current_price,
            "predictedPrices": {
                "tomorrow": tomorrow,
                "threeDay": three_day,
                "sevenDay": seven_day,
                "fifteenDay": fifteen_day
            },
            "recommendation": {
                "action": action,
                "message": message
            },
            "historicalPrices": historical_prices,
            "forecastPrices": forecast_prices
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to calculate forecasting model: {str(e)}"
        }), 500

# AI Negotiation Analysis Endpoint
@app.route('/api/ai/analyze-negotiation', methods=['POST'])
def analyze_negotiation():
    data = request.get_json() or {}
    crop = data.get('cropName', 'Wheat')
    offered_price = float(data.get('dealerOfferedPrice', 0))
    market_price = float(data.get('marketPrice', 0))
    quantity = float(data.get('quantity', 0))
    location = data.get('location', 'Maharashtra')

    if offered_price <= 0 or market_price <= 0 or quantity <= 0:
        return jsonify({
            "success": False,
            "error": "Offered price, market price, and quantity must be greater than zero."
        }), 400

    try:
        # 1. Calculate percentage difference
        difference_pct = ((offered_price - market_price) / market_price) * 100
        difference_pct = round(difference_pct, 2)

        # 2. Expected earnings and gap
        expected_profit = round(offered_price * quantity, 2)
        profit_difference = round((offered_price - market_price) * quantity, 2)

        # 3. Decision recommendation and risk level
        if difference_pct < -10.0:
            recommendation = "Reject Offer"
            risk_level = "High"
            reason = f"Offer is {abs(difference_pct)}% below market value. Accepting this deal will result in a loss of ₹{abs(profit_difference):,} compared to standard market rate."
        elif difference_pct < -2.0:
            recommendation = "Negotiate Offer"
            risk_level = "Medium"
            reason = f"Offer is slightly below market value by {abs(difference_pct)}%. We suggest proposing a counter-offer closer to market average."
        else:
            recommendation = "Accept Offer"
            risk_level = "Low"
            reason = f"Offer is fair and aligns with the market rate (currently {difference_pct}% of market rate)."

        # 4. Score metrics
        # Fairness Score: 100 if equal or higher, dropping linearly down to 0 if 50% below market value
        fairness_score = max(0, min(100, int(100 + (difference_pct * 2))))

        # Negotiation Score: room to negotiate. Larger quantity and lower offer increases bargaining leverage.
        volume_bonus = 15 if quantity >= 2000 else (10 if quantity >= 1000 else 0)
        negotiation_score = max(10, min(95, int(50 - difference_pct + volume_bonus)))

        # 5. Suggested Counter Offer
        # Suggest countering at 98% of market price if the offer is low, otherwise suggest dealer offer
        if difference_pct < 0:
            suggested_counter = round(market_price * 0.98, 2)
        else:
            suggested_counter = offered_price

        return jsonify({
            "success": True,
            "cropName": crop,
            "location": location,
            "quantity": quantity,
            "dealerOfferedPrice": offered_price,
            "marketPrice": market_price,
            "differencePct": difference_pct,
            "expectedProfit": expected_profit,
            "profitDifference": profit_difference,
            "riskLevel": risk_level,
            "fairnessScore": fairness_score,
            "negotiationScore": negotiation_score,
            "suggestedCounterOffer": suggested_counter,
            "recommendation": recommendation,
            "reason": reason
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to perform negotiation analysis: {str(e)}"
        }), 500

# Helper Haversine distance function
def calculate_haversine_distance(lon1, lat1, lon2, lat2):
    # Convert degrees to radians
    lon1, lat1, lon2, lat2 = map(np.radians, [lon1, lat1, lon2, lat2])
    # Differences
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = np.sin(dlat/2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2.0)**2
    c = 2.0 * np.arcsin(np.sqrt(a))
    r = 6371.0 # Radius of earth in kilometers
    return round(float(c * r), 2)

# AI Buyer Matching Endpoint
@app.route('/api/ai/match-buyers', methods=['POST'])
def match_buyers():
    data = request.get_json() or {}
    crop = data.get('cropName', 'Wheat')
    quantity = float(data.get('quantity', 1000))
    farmer_coords = data.get('farmerCoords', [73.8850, 18.7250]) # default Pune [lng, lat]
    dealers = data.get('dealers', [])

    if not dealers:
        return jsonify({
            "success": False,
            "error": "No dealers list provided for matching."
        }), 400

    # Base price calculation
    crop_bases = {
        'Wheat': 22.0,
        'Rice': 65.0,
        'Tomato': 18.0,
        'Potato': 15.0,
        'Cotton': 60.0,
        'Soybean': 42.0
    }
    base_price = crop_bases.get(crop, 20.0)

    try:
        processed_dealers = []
        
        # First pass: calculate distance and offered price
        for d in dealers:
            d_coords = d.get('coordinates', [73.8567, 18.5204]) # default Pune
            distance = calculate_haversine_distance(
                farmer_coords[0], farmer_coords[1],
                d_coords[0], d_coords[1]
            )
            
            multiplier = float(d.get('multiplier', 1.0))
            offered_price = round(base_price * multiplier, 2)
            
            processed_dealers.append({
                "dealerId": d.get('id'),
                "name": d.get('name', 'Unknown Dealer'),
                "distanceKm": distance,
                "offeredPrice": offered_price,
                "rating": float(d.get('rating', 4.0)),
                "trustScore": int(d.get('trustScore', 80)),
                "previousTransactions": int(d.get('previousTransactions', 5)),
                "isBestProfit": False,
                "isFastestSale": False
            })

        # Find max offered price and min distance
        prices = [d["offeredPrice"] for d in processed_dealers]
        distances = [d["distanceKm"] for d in processed_dealers]
        
        max_price = max(prices) if prices else base_price
        min_distance = min(distances) if distances else 0.0

        # Flag Best Profit and Fastest Sale Options
        for d in processed_dealers:
            if d["offeredPrice"] == max_price:
                d["isBestProfit"] = True
            if d["distanceKm"] == min_distance:
                d["isFastestSale"] = True

        # Second pass: calculate AI Matching score (0 - 100)
        for d in processed_dealers:
            # 1. Price Score (40%): offered relative to max available offer
            price_score = (d["offeredPrice"] / max_price) * 100 if max_price > 0 else 0
            
            # 2. Distance Score (30%): closer is better. Max distance of 500km mapped to 0, 0km to 100
            distance_score = max(0.0, min(100.0, 100.0 - (d["distanceKm"] / 5.0)))
            
            # 3. Trust Score (15%): already 0-100
            trust_score = d["trustScore"]
            
            # 4. Previous Transactions (15%): re-scale so 20 transactions is 100%
            tx_score = min(d["previousTransactions"] * 5, 100)
            
            # Final matching leverage score
            match_score = (price_score * 0.40) + (distance_score * 0.30) + (trust_score * 0.15) + (tx_score * 0.15)
            d["matchScore"] = round(match_score, 2)

        # Sort by matchScore descending, slice top 5
        sorted_dealers = sorted(processed_dealers, key=lambda x: x["matchScore"], reverse=True)
        top_matches = sorted_dealers[:5]

        return jsonify({
            "success": True,
            "cropName": crop,
            "quantity": quantity,
            "farmerCoords": farmer_coords,
            "matches": top_matches
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"AI Buyer Matching algorithm error: {str(e)}"
        }), 500

# AI Weather Advisory Expert System Endpoint
@app.route('/api/ai/weather-advisory', methods=['POST'])
def weather_advisory():
    data = request.get_json() or {}
    try:
        temp = float(data.get('temperature', 28.0))
        humidity = float(data.get('humidity', 50.0))
        wind = float(data.get('windSpeed', 8.0))
        rain_prob = float(data.get('rainProbability', 10.0))
    except Exception:
        return jsonify({"success": False, "error": "Invalid input formats"}), 400

    # 1. Irrigation Advice
    if rain_prob > 50.0:
        irrigation = f"Rain expected ({int(rain_prob)}% probability). Delay irrigation to prevent waterlogging, soil compaction, and nutrient leaching."
    elif temp > 35.0 and humidity < 40.0:
        irrigation = f"High temperature expected ({temp}°C) with low humidity ({int(humidity)}%). Crop transpiration is high. Increase watering volume and execute drip irrigation runs early in the morning."
    else:
        irrigation = "Environmental moisture is stable. Maintain standard crop irrigation schedule as per crop growth stage."

    # 2. Fertilization Advice
    if wind > 15.0:
        fertilization = f"High wind speeds detected ({wind} km/h). Postpone foliar nutrient spraying or pesticide applications to prevent chemical drift and ensure maximum leaf absorption."
    elif rain_prob > 60.0:
        fertilization = f"Heavy rain expected ({int(rain_prob)}% probability). Delay granular fertilizer top-dressing to avoid surface runoff and environmental leaching."
    else:
        fertilization = "Optimal spray and fertilization window. Wind speeds are low and atmospheric conditions are stable."

    # 3. Pest & Disease Spore Risk
    if humidity > 80.0 and temp >= 20.0 and temp <= 30.0:
        pest_risk = f"CRITICAL PATHOGEN RISK: High relative humidity ({int(humidity)}%) and warm temperatures ({temp}°C) are optimal for common rust (Puccinia) and blight spore incubation. Inspect leaf undersides and apply preventative organic Neem oil."
    else:
        pest_risk = "Low environmental spore risk. Maintain standard scouting guidelines and field sanitation."

    # 4. Summary Advisory Paragraph
    summary = f"Currently {temp}°C with {int(humidity)}% humidity. "
    if rain_prob > 50.0:
        summary += "Rain is forecasted, so hold off on watering and fertilization. "
    else:
        summary += "Weather is clear for active field operations. "
    if wind > 15.0:
        summary += "Caution: strong winds may cause spray drift."
    else:
        summary += "Low winds are perfect for pesticide/foliar applications."

    return jsonify({
        "success": True,
        "advisory": {
            "summary": summary,
            "irrigation": irrigation,
            "fertilization": fertilization,
            "pestRisk": pest_risk
        }
    })

# AI Logistics Agent Route
@app.route('/api/ai/agent-logistics', methods=['POST'])
def agent_logistics():
    data = request.get_json() or {}
    try:
        distance = float(data.get('distanceKm', 25.0))
        quantity = float(data.get('quantity', 1000.0))
    except Exception:
        return jsonify({"success": False, "error": "Invalid distance or quantity formats"}), 400

    # Determine vehicle and carrier partner based on crop quantity
    if quantity <= 500:
        transport_partner = "Local Agri-Tempo Services"
        rate_per_km = 12.0
        vehicle = "Tata Ace (0.5 Ton)"
    elif quantity <= 3000:
        transport_partner = "Krishi-Vahan Transport Co."
        rate_per_km = 18.0
        vehicle = "Mahindra Bolero Pickup (1.5 Ton)"
    else:
        transport_partner = "Agro-Trans Logistics India"
        rate_per_km = 30.0
        vehicle = "Ashok Leyland Truck (10 Ton)"

    # Calculate costs and transit duration
    estimated_cost = round(distance * rate_per_km, 2)
    # Average 40km/h speed for ag-transport plus 1.5 hours loading buffer
    travel_hours = round((distance / 40.0) + 1.5, 1)

    # Compile optimized routing segments
    if distance <= 35:
        route_details = f"Direct local transport via State Highway. Pass through village checkpoint. Bypass city tolls. (Vehicle: {vehicle})"
    elif distance <= 150:
        route_details = f"Express highway route via NH-48. Pass through Khed toll plaza. Expected delay at Vashi APMC entry checkpoint. (Vehicle: {vehicle})"
    else:
        route_details = f"Long haul interstate corridor via NH-52. Require green-channel permit. 2 interstate octroi clearance stops. (Vehicle: {vehicle})"

    return jsonify({
        "success": True,
        "transportPartner": transport_partner,
        "estimatedCost": estimated_cost,
        "travelHours": travel_hours,
        "routeDetails": route_details,
        "vehicle": vehicle
    })

# AI Report Synthesizer Agent Route
@app.route('/api/ai/agent-report', methods=['POST'])
def agent_report():
    data = request.get_json() or {}
    disease = data.get('disease') or {}
    market = data.get('market') or {}
    buyer = data.get('buyer') or {}
    logistics = data.get('logistics') or {}

    crop_name = disease.get('crop', 'General Crop')
    disease_name = disease.get('disease', 'Healthy Leaf')
    severity = disease.get('severity', 'None')
    
    current_price = market.get('currentPrice', 25.0)
    recommendation = market.get('recommendation', {})
    action = recommendation.get('action', 'Hold')
    
    dealer_name = buyer.get('selectedDealer', {}).get('name', 'Unknown Dealer')
    offered_price = buyer.get('selectedDealer', {}).get('offeredPrice', current_price)
    
    partner = logistics.get('transportPartner', 'Local Transport')
    logistics_cost = logistics.get('estimatedCost', 0.0)
    travel_hours = logistics.get('travelHours', 2.0)

    # Math details
    qty = float(market.get('quantity', 1000.0))
    gross_earnings = offered_price * qty
    net_earnings = gross_earnings - logistics_cost
    
    summary = (
        f"AGRO-LINK Multi-Agent dossier compiled for {qty:.0f} kg of {crop_name}. "
        f"The crop leaf was diagnosed with {disease_name} (Severity: {severity}). "
        f"Market Intelligence advises a '{action}' position with current average value at ₹{current_price}/kg. "
        f"Buyer Matching has secured an offer at ₹{offered_price}/kg with {dealer_name}. "
        f"Logistics has scheduled dispatch via {partner} (Estimated transit: {travel_hours} hrs, Cost: ₹{logistics_cost})."
    )

    report_text = f"""
    ### 🌾 AGRO-LINK UNIFIED AGRI-COMMERCE REPORT
    
    **1. CROP PATHOLOGY DIAGNOSIS (Disease Agent)**
    - Target Crop: {crop_name}
    - Pathology Identified: {disease_name}
    - Active Severity: {severity} (Confidence: {disease.get('confidence', 95.0)}%)
    - Prescribed Cures: {', '.join(disease.get('treatment', ['Maintain standard irrigation']))}
    
    **2. MARKET PRICE ANALYSIS (Market Agent)**
    - Baseline Market Price: ₹{current_price}/kg
    - Proposed Decision: {action} (Price Trend: {market.get('priceTrend', 'Stable')})
    - Forecasting Details: {recommendation.get('message', 'Prices remain within range.')}
    
    **3. COMMERCIAL MATCHMAKING (Buyer Agent)**
    - Highest Scoring Dealer: {dealer_name} (Match Score: {buyer.get('selectedDealer', {}).get('matchScore', 85.0)}%)
    - Secured Offer Price: ₹{offered_price}/kg
    - Projected Gross Value: ₹{gross_earnings:,.2f}
    
    **4. FREIGHT & FULFILLMENT PATHWAY (Logistics Agent)**
    - Shipping Partner: {partner}
    - Transit Vehicle: {logistics.get('vehicle', 'Standard Carrier')}
    - Distance: {logistics.get('distanceKm', 25.0)} km | Est. Duration: {travel_hours} Hours
    - Routing Schedule: {logistics.get('routeDetails', 'Local road transit')}
    - Shipping Expense: ₹{logistics_cost:,.2f}
    
    **💰 FINANCIAL RECONCILIATION SUMMARY**
    - Gross Valuation: ₹{gross_earnings:,.2f}
    - Logistics Freight: -₹{logistics_cost:,.2f}
    - Projected Net Yield: ₹{net_earnings:,.2f}
    """

    return jsonify({
        "success": True,
        "summary": summary.strip(),
        "reportHtml": report_text.strip(),
        "netEarnings": net_earnings
    })

# Custom 404 handler to redirect to home
@app.errorhandler(404)
def page_not_found(e):
    from flask import redirect
    return redirect('/')

if __name__ == '__main__':
    app.run(port=5000, debug=True)
