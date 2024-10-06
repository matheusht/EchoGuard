"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Thermometer, Droplets, Wind } from "lucide-react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { AreaChart, Card as ChartCard } from "@tremor/react";

// Mapbox Access Token
const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  "pk.eyJ1IjoibWF0aGV1c2h0IiwiYSI6ImNtMXdzZXk2azBxeDcybW9lcjNsNXJ3OHUifQ.-hEjgr1XHuAwVKUHwGTfcA";

interface WeatherData {
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
}

interface HourlyData {
  date: string;
  Temperature: number;
  Humidity: number;
}

interface FireSpot {
  id: number;
  latitude: number;
  longitude: number;
  risk: "High" | "Medium" | "Low";
}

const useWeatherData = (lat: number, lon: number) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
        );
        if (!response.ok) throw new Error("Weather data fetch failed");
        const result: WeatherData = await response.json();
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lat, lon]);

  return { data, loading, error };
};

const useFireSpotData = () => {
  const [fireSpots, setFireSpots] = useState<FireSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFireSpots = async () => {
      try {
        // Simulating API call with mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockData: FireSpot[] = [
          { id: 1, latitude: 37.7749, longitude: -122.4194, risk: "High" },
          { id: 2, latitude: 34.0522, longitude: -118.2437, risk: "Medium" },
          { id: 3, latitude: 40.7128, longitude: -74.006, risk: "Low" },
        ];
        setFireSpots(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchFireSpots();
  }, []);

  return { fireSpots, loading, error };
};

const calculateFireRisk = (
  temp: number,
  humidity: number
): "High" | "Medium" | "Low" => {
  const risk = temp * 1.5 - humidity * 0.5;
  if (risk > 60) return "High";
  if (risk > 40) return "Medium";
  return "Low";
};

export default function FireSpotPrediction() {
  const [viewState, setViewState] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    zoom: 3,
  });

  const {
    data: weatherData,
    loading: weatherLoading,
    error: weatherError,
  } = useWeatherData(viewState.latitude, viewState.longitude);
  const {
    fireSpots,
    loading: fireSpotsLoading,
    error: fireSpotsError,
  } = useFireSpotData();

  if (weatherLoading || fireSpotsLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  if (weatherError || fireSpotsError)
    return (
      <div className="flex justify-center items-center h-screen">
        Error: {weatherError || fireSpotsError}
      </div>
    );
  if (!weatherData)
    return (
      <div className="flex justify-center items-center h-screen">
        No data available
      </div>
    );

  const currentTemp = weatherData.main.temp;
  const currentHumidity = weatherData.main.humidity;
  const currentWindSpeed = weatherData.wind.speed;
  const fireRisk = calculateFireRisk(currentTemp, currentHumidity);

  // Mock hourly data (replace with actual API data when available)
  const hourlyData: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
    date: `${i}:00`,
    Temperature: currentTemp + Math.random() * 5 - 2.5,
    Humidity: currentHumidity + Math.random() * 10 - 5,
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Fire Spot Prediction</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Fire Spot Map</CardTitle>
            <CardDescription>Current fire risk areas</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <Map
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/dark-v10"
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              {fireSpots.map((spot) => (
                <Marker
                  key={spot.id}
                  latitude={spot.latitude}
                  longitude={spot.longitude}
                  anchor="bottom"
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-white ${
                      spot.risk === "High"
                        ? "bg-red-500"
                        : spot.risk === "Medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />
                </Marker>
              ))}
            </Map>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentTemp.toFixed(1)}°C</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humidity</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentHumidity}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wind Speed</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentWindSpeed.toFixed(1)} m/s
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Fire Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert
              className={`${
                fireRisk === "High"
                  ? "bg-red-100"
                  : fireRisk === "Medium"
                  ? "bg-yellow-100"
                  : "bg-green-100"
              }`}
            >
              <AlertTitle>Fire Risk: {fireRisk}</AlertTitle>
              <AlertDescription>
                Based on current weather conditions, the fire risk is{" "}
                {fireRisk.toLowerCase()}.
                {fireRisk === "High" &&
                  " Please be extremely cautious and avoid any activities that could start a fire."}
                {fireRisk === "Medium" &&
                  " Exercise caution with any fire-related activities."}
                {fireRisk === "Low" &&
                  " Conditions are favorable, but always practice fire safety."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>24-Hour Forecast</CardTitle>
            <CardDescription>Temperature and Humidity Trends</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ChartCard>
              <AreaChart
                className="h-[300px] mt-4"
                data={hourlyData}
                index="date"
                categories={["Temperature", "Humidity"]}
                colors={["indigo", "cyan"]}
                yAxisWidth={40}
              />
            </ChartCard>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
