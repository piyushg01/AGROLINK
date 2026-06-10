import csv
import datetime
import random
import os

def generate_data():
    crops = ['Wheat', 'Rice', 'Tomato', 'Potato', 'Cotton', 'Soybean']
    locations = ['Maharashtra', 'Punjab', 'Gujarat', 'Uttar Pradesh', 'Madhya Pradesh']
    
    # Base prices per kg
    base_prices = {
        'Wheat': 22.0,
        'Rice': 65.0,
        'Tomato': 18.0,
        'Potato': 15.0,
        'Cotton': 60.0,
        'Soybean': 42.0
    }
    
    # Daily trend factors (-0.05 to +0.08 per day)
    trends = {
        'Wheat': 0.02,   # slight increase
        'Rice': 0.05,    # solid increase
        'Tomato': -0.04,  # decrease (seasonal glut)
        'Potato': 0.01,   # stable
        'Cotton': 0.08,   # high growth
        'Soybean': -0.01  # slight decrease
    }
    
    # Location multipliers
    loc_multipliers = {
        'Maharashtra': 1.05,
        'Punjab': 1.02,
        'Gujarat': 1.03,
        'Uttar Pradesh': 0.98,
        'Madhya Pradesh': 0.95
    }
    
    end_date = datetime.date(2026, 6, 4)
    start_date = end_date - datetime.timedelta(days=59) # 60 days of records
    
    file_path = os.path.join(os.path.dirname(__file__), 'historical_prices_dataset.csv')
    
    with open(file_path, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['date', 'crop', 'location', 'price'])
        
        random.seed(42) # repeatable
        
        for day in range(60):
            current_date = start_date + datetime.timedelta(days=day)
            date_str = current_date.strftime('%Y-%m-%d')
            
            for crop in crops:
                base = base_prices[crop]
                trend = trends[crop] * day # linear trend
                
                for loc in locations:
                    multiplier = loc_multipliers[loc]
                    
                    # Seasonality (sine wave)
                    seasonality = 1.5 * (1.0 + 0.15 * (day % 15)) # 15 day cycles
                    
                    # Random noise
                    noise = random.uniform(-0.5, 0.5)
                    
                    price = (base + trend) * multiplier + noise
                    price = round(max(2.0, price), 2)
                    
                    writer.writerow([date_str, crop, loc, price])
                    
    print(f"Dataset generated successfully at: {file_path}")

if __name__ == '__main__':
    generate_data()
