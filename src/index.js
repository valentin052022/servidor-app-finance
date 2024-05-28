// ---------
// Importar los módulos necesarios
import express from "express";
import fetch from "node-fetch";
import { SMA } from "technicalindicators";
import { ADX } from "technicalindicators";
import dotenv from "dotenv";

// Cargar las variables de entorno
dotenv.config();

// Crear la aplicación de Express
const app = express();
const port = 3000;

// Función para obtener los datos de una acción específica
const obtenerDatosAccion = (accion) => {
  const ApiKey = process.env.API_KEY;
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${accion}&outputsize=compact&apikey=${ApiKey}`;

  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const fecha = data["Time Series (Daily)"];
      const result = calcularDatos(fecha);

      return {
        accion,
        price: result.lastPrice,
        SMA5: result.sma5,
        SMA10: result.sma10,
        SMA20: result.sma20,
        adx: result.adx,
        volume: result.volumes
      };
    });
};

// Ruta para obtener los datos de una acción específica
app.get("/:accion", async (req, res) => {
  const accion = req.params.accion;
  res.setHeader("Access-Control-Allow-Origin", "*"); // Permite el origen de tu servidor de desarrollo
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE"); // Especifica métodos permitidos
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Permite cabeceras relevantes
  try {
    const data = await obtenerDatosAccion(accion);
    res.json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error obteniendo los datos");
  }
});

// Función para calcular los datos de una acción
const calcularDatos = (data) => {
  // Cálculos de indicadores y precios aquí
  const dias = data;

  const closePrice = [];
  const openPrice = [];
  const volume = [];
  const highPrice = [];
  const lowPrice = [];

  for (let dia in dias) {
    openPrice.push(Number(dias[dia]["1. open"]));
    highPrice.push(Number(dias[dia]["2. high"]));
    lowPrice.push(Number(dias[dia]["3. low"]));
    closePrice.push(Number(dias[dia]["4. close"]));
    volume.push(Number(dias[dia]["5. volume"]));
  }

  const prices = closePrice.reverse();
  const opens = openPrice.reverse();
  const highs = highPrice.reverse();
  const lows = lowPrice.reverse();
  const volumes = volume.reverse();

  // periodos
  const period20 = 20;
  const period10 = 10;
  const period5 = 5;
  const adxPeriod = 14;

  // indicadores
  const sma20 = SMA.calculate({ period: period20, values: prices });
  const sma10 = SMA.calculate({ period: period10, values: prices });
  const sma5 = SMA.calculate({ period: period5, values: prices });
  const adx = ADX.calculate({
    period: adxPeriod,
    high: highs,
    low: lows,
    close: prices,
  });

  const lastPrice = prices[prices.length - 1];

  // Tu función de cálculo de datos aquí
  // Devuelve los datos que deseas mostrar en la página web
  return {
    lastPrice,
    sma20,
    sma10,
    sma5,
    adx,
    volumes,
  };
};

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}/`);
});
