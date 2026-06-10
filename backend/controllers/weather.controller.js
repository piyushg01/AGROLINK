import User from '../models/user.model.js';
import WeatherHistory from '../models/weatherHistory.model.js';

// Resolve weather condition text based on metrics
function determineCondition(currentData) {
  const rain = currentData.rain || currentData.precipitation || 0;
  const humidity = currentData.relative_humidity_2m || 50;
  const wind = currentData.wind_speed_10m || 10;

  if (rain > 0.5) return 'Rainy';
  if (wind > 20) return 'Windy';
  if (humidity > 75) return 'Cloudy';
  return 'Sunny';
}

// 1. POST /api/weather/check
export const checkWeatherAdvisory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    // Coordinates can be passed in request body (e.g. from browser geolocation)
    let lng = req.body.longitude !== undefined && req.body.longitude !== null ? parseFloat(req.body.longitude) : null;
    let lat = req.body.latitude !== undefined && req.body.latitude !== null ? parseFloat(req.body.latitude) : null;
    let locationName = req.body.locationName || user.address || 'Pune, Maharashtra';

    if (lng === null || lat === null) {
      const coords = user.location?.coordinates || [73.8567, 18.5204];
      lng = coords[0];
      lat = coords[1];
    } else {
      // Try to reverse geocode using Nominatim for real names
      try {
        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
        const reverseRes = await fetch(reverseUrl, {
          headers: { 'User-Agent': 'Agrolink-App/1.0 (contact@agrolink.org)' }
        });
        const reverseData = await reverseRes.json();
        if (reverseData && reverseData.address) {
          const addr = reverseData.address;
          const village = addr.village || addr.suburb || addr.town || addr.city || addr.county || addr.state;
          const state = addr.state || '';
          locationName = village + (state ? `, ${state}` : '');
        } else if (reverseData && reverseData.display_name) {
          locationName = reverseData.display_name.split(',').slice(0, 3).join(', ');
        } else {
          locationName = `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
        }
      } catch (geocodeErr) {
        console.warn('Nominatim reverse geocode failed:', geocodeErr.message);
        locationName = `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
      }
    }

    // 1. Fetch live weather and 7-day forecast from Open-Meteo API
    let weatherData = null;
    try {
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`;
      const meteoRes = await fetch(openMeteoUrl);
      weatherData = await meteoRes.json();
    } catch (meteoErr) {
      console.error('Open-Meteo fetch failed, using fallback simulated weather:', meteoErr.message);
    }

    // 2. Simulated weather fallback if API is down
    if (!weatherData || !weatherData.current) {
      const mockDaily = {
        time: Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          return d.toISOString().split('T')[0];
        }),
        temperature_2m_max: [32, 33, 29, 31, 30, 32, 33],
        temperature_2m_min: [22, 23, 21, 22, 22, 23, 24],
        precipitation_probability_max: [10, 20, 80, 40, 15, 10, 5],
        precipitation_sum: [0, 0, 8.5, 2.1, 0, 0, 0]
      };
      
      weatherData = {
        current: {
          temperature_2m: 31.5,
          relative_humidity_2m: 55,
          wind_speed_10m: 12.0,
          precipitation: 0,
          rain: 0
        },
        daily: mockDaily
      };
    }

    // Extract metrics
    const currentTemp = weatherData.current.temperature_2m;
    const currentHumidity = weatherData.current.relative_humidity_2m;
    const currentWindSpeed = weatherData.current.wind_speed_10m;
    const rainProbability = weatherData.daily.precipitation_probability_max[0] || 0;
    const condition = determineCondition(weatherData.current);

    // Map forecast array (7 days)
    const forecast = weatherData.daily.time.map((date, idx) => ({
      date,
      tempMax: weatherData.daily.temperature_2m_max[idx],
      tempMin: weatherData.daily.temperature_2m_min[idx],
      precipitationProbability: weatherData.daily.precipitation_probability_max[idx] || 0,
      precipitationSum: weatherData.daily.precipitation_sum[idx] || 0
    }));

    // 3. Request advisory from Flask AI microservice
    let advisory = null;
    try {
      const flaskRes = await fetch('http://localhost:5000/api/ai/weather-advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature: currentTemp,
          humidity: currentHumidity,
          windSpeed: currentWindSpeed,
          rainProbability: rainProbability
        })
      });
      const flaskData = await flaskRes.json();
      if (flaskData.success) {
        advisory = flaskData.advisory;
      }
    } catch (flaskErr) {
      console.warn('Flask AI microservice offline. Using Node fallback logic...', flaskErr.message);
    }

    // Fallback advisory logic in Node
    if (!advisory) {
      let irrigation = "Environmental moisture is stable. Maintain standard crop irrigation schedule.";
      let fertilization = "Optimal spray and fertilization window. Wind speeds are low and atmospheric conditions are stable.";
      let pestRisk = "Low environmental spore risk. Maintain standard crop scouting.";

      if (rainProbability > 50) {
        irrigation = `Rain expected (${rainProbability}% probability). Delay irrigation to prevent waterlogging.`;
        fertilization = `Heavy rain expected (${rainProbability}% probability). Delay fertilizer application to avoid runoff.`;
      } else if (currentTemp > 35 && currentHumidity < 40) {
        irrigation = `High temperature expected (${currentTemp}°C) with low humidity (${currentHumidity}%). Crop transpiration is high. Increase watering volume.`;
      }

      if (currentWindSpeed > 15) {
        fertilization = `High wind speeds detected (${currentWindSpeed} km/h). Postpone spraying to prevent chemical drift.`;
      }

      if (currentHumidity > 80 && currentTemp >= 20 && currentTemp <= 30) {
        pestRisk = `High humidity (${currentHumidity}%) and warm weather (${currentTemp}°C) are optimal for disease spores. Apply preventative Neem oil.`;
      }

      advisory = {
        summary: `Currently ${currentTemp}°C with ${currentHumidity}% humidity. Maintain standard checks.`,
        irrigation,
        fertilization,
        pestRisk
      };
    }

    // 4. Save to WeatherHistory database log
    const weatherLog = new WeatherHistory({
      farmer: req.user.id,
      locationName,
      temperature: currentTemp,
      humidity: currentHumidity,
      windSpeed: currentWindSpeed,
      rainProbability,
      condition,
      advisory,
      forecast
    });

    await weatherLog.save();

    // 5. Fetch all farmer history logs
    const history = await WeatherHistory.find({ farmer: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      currentWeather: {
        temperature: currentTemp,
        humidity: currentHumidity,
        windSpeed: currentWindSpeed,
        rainProbability,
        condition
      },
      advisory,
      forecast,
      history
    });

  } catch (error) {
    console.error('Weather advisor query error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during weather check.' });
  }
};

// 2. GET /api/weather/history
export const getWeatherHistory = async (req, res) => {
  try {
    const history = await WeatherHistory.find({ farmer: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('Get weather history error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch weather logs.' });
  }
};

// 3. DELETE /api/weather/history/:id
export const deleteWeatherLog = async (req, res) => {
  try {
    const log = await WeatherHistory.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, error: 'Weather log not found.' });
    }

    // Verify ownership
    if (log.farmer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }

    await log.deleteOne();
    res.status(200).json({ success: true, message: 'Weather log cleared successfully.' });
  } catch (error) {
    console.error('Delete weather log error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete weather log.' });
  }
};
