/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import debounce from "lodash.debounce";
import {
  useState,
  useMemo,
  useRef,
  MutableRefObject,
  LegacyRef,
  useCallback,
  useEffect,
  MouseEventHandler,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Thermometer, Droplets, Wind, Search } from "lucide-react";
import Map, { MapRef, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  "pk.eyJ1IjoibWF0aGV1c2h0IiwiYSI6ImNtMXdzZXk2azBxeDcybW9lcjNsNXJ3OHUifQ.-hEjgr1XHuAwVKUHwGTfcA";
const OPENWEATHER_API_KEY =
  process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
  "61a8c8e99569c319d75a27a0f2ddb4f2";

interface Suggestion {
  id: string;
  place_name: string;
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    full_address: string;
    name: string;
  };
}
interface WeatherData {
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  coord: {
    lat: number;
    lon: number;
  };
  name: string;
}

interface HourlyData {
  time: string;
  temperature: number;
  humidity: number;
}

interface FireRisk {
  latitude: number;
  longitude: number;
  risk: "Alto" | "Médio" | "Baixo";
}

const calculateFireRisk = (
  temp: number,
  humidity: number,
  windSpeed: number
): "Alto" | "Médio" | "Baixo" => {
  const risk = temp * 1.5 - humidity * 0.5 + windSpeed * 2;
  if (risk > 60) return "Alto";
  if (risk > 40) return "Médio";
  return "Baixo";
};

export default function FireSpotPrediction() {
  const [searchInput, setSearchInput] = useState<string>("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mapref = useRef<MutableRefObject<MapRef | undefined>>();
  const [viewState, setViewState] = useState({
    latitude: -15.7801,
    longitude: -47.9292,
    zoom: 4,
  });

  const CustomTooltipContent = ({
    active,
    payload,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card text-card-foreground p-3 rounded-md shadow-lg border border-border">
          <p className="font-semibold">{`Hora: ${payload[0].payload.time}`}</p>
          <p>{`Temperatura: ${payload[0].payload.temperature.toFixed(1)}°C`}</p>
          <p>{`Umidade: ${payload[0].payload.humidity.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  function removeSpecialChars(input: string): string {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  const handleSearch = async (input = searchInput) => {
    if (!input) return;

    setLoading(true);
    setError(null);

    console.log(searchInput);

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          removeSpecialChars(input)
        )}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      if (!response.ok) throw new Error("Falha ao buscar dados meteorológicos");
      const data: WeatherData = await response.json();
      setWeatherData(data);
      setViewState({
        latitude: data.coord.lat,
        longitude: data.coord.lon,
        zoom: 10,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro desconhecido"
      );
    } finally {
      setLoading(false);
    }
  };

  const fireRisk = useMemo(() => {
    if (!weatherData) return null;
    const risk = calculateFireRisk(
      weatherData.main.temp,
      weatherData.main.humidity,
      weatherData.wind.speed
    );
    return {
      latitude: weatherData.coord.lat,
      longitude: weatherData.coord.lon,
      risk: risk,
    };
  }, [weatherData]);

  const hourlyData: HourlyData[] = weatherData
    ? Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        temperature: Number(
          (weatherData.main.temp + Math.random() * 5 - 2.5).toFixed(1)
        ),
        humidity: Number(
          (weatherData.main.humidity + Math.random() * 10 - 5).toFixed(1)
        ),
      }))
    : [];

  const handleInputChange = useCallback(
    debounce(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setSearchInput(input);

      if (input.length > 2) {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const url = `https://api.mapbox.com/search/geocode/v6/forward?access_token=${token}&q=${input}`;

        try {
          const response = await axios.get(url);
          setSuggestions(response.data.features as Suggestion[]);
        } catch (error) {
          console.error("Error fetching autocomplete suggestions:", error);
        }
      } else {
        setSuggestions([]);
      }
    }, 300), // Debounce with 300ms delay
    []
  );

  const handleChangeInputCall = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setSearchInput(input);
    handleInputChange(e);
  };

  useEffect(() => {
    return () => {
      handleInputChange.cancel();
    };
  }, []);

  const handleSuggestionClick = (place: Suggestion) => {
    setSearchInput(place.properties.name);
    setSuggestions([]);
    handleSearch(place.properties.name);
  };

  console.log(suggestions);

  return (
    <div className="container mx-auto p-4 min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">
        Previsão de Risco de Incêndio
      </h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Buscar Localização</CardTitle>
          <CardDescription>
            Digite uma localização para ver os riscos de incêndio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative flex flex-col space-y-2">
            {/* Suggestions list positioned above the input */}

            {/* Input and button container */}
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Digite uma cidade ou local"
                value={searchInput}
                onChange={handleChangeInputCall}
                className="flex-grow"
              />
              <Button
                onClick={
                  handleSearch as unknown as MouseEventHandler<HTMLButtonElement>
                }
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Search className="mr-2 h-4 w-4" /> Buscar
              </Button>
            </div>
            {suggestions.length > 0 && (
              <ul className="absolute top-full mb-2 w-full bg-white shadow-lg border rounded-md z-10">
                {suggestions.map((place) => (
                  <li
                    key={place.id}
                    onClick={() => handleSuggestionClick(place)}
                    className="p-2 cursor-pointer hover:bg-gray-200 text-black"
                  >
                    {place.properties.full_address}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {error && <p className="text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>

      {loading && <div className="text-center text-xl">Carregando...</div>}

      {weatherData && (
        <>
          <Card className="mb-8 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl">
                Mapa de Risco de Incêndio
              </CardTitle>
              <CardDescription>
                Área de risco de incêndio atual em {weatherData.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px] relative">
                <Map
                  ref={mapref as unknown as LegacyRef<MapRef>}
                  {...viewState}
                  onMove={(evt) => setViewState(evt.viewState)}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/dark-v10"
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  {fireRisk && (
                    <Marker
                      latitude={fireRisk.latitude}
                      longitude={fireRisk.longitude}
                      anchor="bottom"
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 border-white ${
                          fireRisk.risk === "Alto"
                            ? "bg-destructive"
                            : fireRisk.risk === "Médio"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      />
                    </Marker>
                  )}
                </Map>
              </div>
            </CardContent>
            <div className="flex justify-center space-x-4 p-4 bg-card">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-destructive mr-2"></div>
                <span>Alto Risco</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span>Médio Risco</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span>Baixo Risco</span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  Temperatura
                </CardTitle>
                <Thermometer className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {weatherData.main.temp.toFixed(1)}°C
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Umidade</CardTitle>
                <Droplets className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {weatherData.main.humidity}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  Velocidade do Vento
                </CardTitle>
                <Wind className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(weatherData.wind.speed * 3.6).toFixed(1)} km/h
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Risco de Incêndio</CardTitle>
            </CardHeader>
            <CardContent>
              {fireRisk && (
                <Alert
                  className={`${
                    fireRisk.risk === "Alto"
                      ? "bg-destructive/15 text-destructive-foreground"
                      : fireRisk.risk === "Médio"
                      ? "bg-yellow-500/15 text-yellow-700"
                      : "bg-green-500/15 text-green-700"
                  }`}
                >
                  <AlertTitle className="text-xl mb-2">
                    Risco de Incêndio: {fireRisk.risk}
                  </AlertTitle>
                  <AlertDescription className="text-base">
                    Com base nas condições meteorológicas atuais, o risco de
                    incêndio é {fireRisk.risk.toLowerCase()}.
                    {fireRisk.risk === "Alto" &&
                      " Por favor, seja extremamente cauteloso e evite qualquer atividade que possa iniciar um incêndio."}
                    {fireRisk.risk === "Médio" &&
                      " Tenha cuidado com atividades relacionadas a fogo."}
                    {fireRisk.risk === "Baixo" &&
                      " As condições são favoráveis, mas sempre pratique a segurança contra incêndios."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Previsão Horária</CardTitle>
              <CardDescription>
                Temperatura e Umidade nas próximas 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))"
                      label={{
                        value: "Temperatura (°C)",
                        angle: -90,
                        position: "insideLeft",
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      label={{
                        value: "Umidade (%)",
                        angle: 90,
                        position: "insideRight",
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <Tooltip content={<CustomTooltipContent />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="temperature"
                      name="Temperatura"
                      stroke="hsl(var(--primary))"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="humidity"
                      name="Umidade"
                      stroke="hsl(var(--foreground))"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
