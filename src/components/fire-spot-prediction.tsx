/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Thermometer, Droplets, Wind, Search } from 'lucide-react'
import Map, { Marker } from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, TooltipProps, Legend, ResponsiveContainer } from 'recharts'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "pk.eyJ1IjoibWF0aGV1c2h0IiwiYSI6ImNtMXdzZXk2azBxeDcybW9lcjNsNXJ3OHUifQ.-hEjgr1XHuAwVKUHwGTfcA"
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "61a8c8e99569c319d75a27a0f2ddb4f2"

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

const calculateFireRisk = (temp: number, humidity: number, windSpeed: number): "Alto" | "Médio" | "Baixo" => {
  const risk = (temp * 1.5) - (humidity * 0.5) + (windSpeed * 2)
  if (risk > 60) return 'Alto'
  if (risk > 40) return 'Médio'
  return 'Baixo'
}

export default function FireSpotPrediction() {
  const [searchInput, setSearchInput] = useState<string>("")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [viewState, setViewState] = useState({
    latitude: -15.7801,
    longitude: -47.9292,
    zoom: 4,
  })

  const CustomTooltipContent = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white border border-gray-200 p-2 rounded shadow-md">
          <p className="text-sm">{`Hora: ${payload[0].payload.time}`}</p>
          <p className="text-sm">{`Temperatura: ${payload[0].payload.temperature.toFixed(1)}°C`}</p>
          <p className="text-sm">{`Umidade: ${payload[0].payload.humidity.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  const handleSearch = async () => {
    if (!searchInput) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchInput)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      )
      if (!response.ok) throw new Error("Falha ao buscar dados meteorológicos")
      const data: WeatherData = await response.json()
      setWeatherData(data)
      setViewState({
        latitude: data.coord.lat,
        longitude: data.coord.lon,
        zoom: 10,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const fireRisk = useMemo(() => {
    if (!weatherData) return null
    const risk = calculateFireRisk(weatherData.main.temp, weatherData.main.humidity, weatherData.wind.speed)
    return {
      latitude: weatherData.coord.lat,
      longitude: weatherData.coord.lon,
      risk: risk
    }
  }, [weatherData])

  const hourlyData: HourlyData[] = weatherData
    ? Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        temperature: Number((weatherData.main.temp + Math.random() * 5 - 2.5).toFixed(1)),
        humidity: Number((weatherData.main.humidity + Math.random() * 10 - 5).toFixed(1)),
      }))
    : []

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Previsão de Risco de Incêndio</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Buscar Localização</CardTitle>
          <CardDescription>Digite uma localização para ver os riscos de incêndio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Digite uma cidade ou local"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </CardContent>
      </Card>

      {loading && <div className="text-center">Carregando...</div>}

      {weatherData && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Mapa de Risco de Incêndio</CardTitle>
              <CardDescription>Área de risco de incêndio atual em {weatherData.name}</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <Map
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
                      className={`w-4 h-4 rounded-full border-2 border-white ${
                        fireRisk.risk === "Alto"
                          ? "bg-red-500"
                          : fireRisk.risk === "Médio"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    />
                  </Marker>
                )}
              </Map>
            </CardContent>
            <div className="flex justify-center space-x-4 mt-2">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temperatura</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weatherData.main.temp.toFixed(1)}°C</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Umidade</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weatherData.main.humidity}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Velocidade do Vento</CardTitle>
                <Wind className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(weatherData.wind.speed * 3.6).toFixed(1)} km/h</div>
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Risco de Incêndio</CardTitle>
              </CardHeader>
              <CardContent>
                {fireRisk && (
                  <Alert className={`${fireRisk.risk === 'Alto' ? 'bg-red-100' : fireRisk.risk === 'Médio' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    <AlertTitle>Risco de Incêndio: {fireRisk.risk}</AlertTitle>
                    <AlertDescription>
                      Com base nas condições meteorológicas atuais, o risco de incêndio é {fireRisk.risk.toLowerCase()}.
                      {fireRisk.risk === 'Alto' && ' Por favor, seja extremamente cauteloso e evite qualquer atividade que possa iniciar um incêndio.'}
                      {fireRisk.risk === 'Médio' && ' Tenha cuidado com atividades relacionadas a fogo.'}
                      {fireRisk.risk === 'Baixo' && ' As condições são favoráveis, mas sempre pratique a segurança contra incêndios.'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Previsão Horária</CardTitle>
              <CardDescription>Temperatura e Umidade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" label={{ value: 'Temperatura (°C)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Umidade (%)', angle: 90, position: 'insideRight' }} />
                    <Tooltip content={<CustomTooltipContent />} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="temperature" name="Temperatura" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="humidity" name="Umidade" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}