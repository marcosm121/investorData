# API de Datos de Inversiones

Backend en Node.js con TypeScript que expone endpoints para gestionar tickers de acciones y obtener precios.

## 🚀 Características

- **GET /many**: Obtiene todos los tickers con precios actuales del mercado
- **GET /manycsv**: Igual que `/many` pero en formato CSV
- **GET /manyall**: Igual que `/many` pero con precios en `{ ars, usd }`
- **GET /manysave**: Igual que `/many` + persiste snapshots en MongoDB
- **GET /manyhistory/:date**: Precios históricos para una fecha dada
- **GET /news**: 5 noticias curadas por LLM para el inversor argentino
- **POST /add**: Agrega un nuevo ticker a la base de datos
- **POST /remove**: Remueve un ticker de la base de datos
- Base de datos MongoDB para persistencia
- TypeScript para type safety
- Manejo de errores robusto

## 📋 Prerrequisitos

- Node.js (versión 16 o superior)
- MongoDB (instalado y ejecutándose localmente)
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd investorData
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Copiar el archivo de ejemplo
   cp env.example .env
   
   # Editar .env con tus configuraciones
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/investorData
   NODE_ENV=development

   # NewsAPI + Groq (para GET /news)
   NEWS_API_KEY=...
   GROQ_API_KEY=...
   GROQ_MODEL=llama-3.3-70b-versatile

   # Prompt Inventory (ver sección más abajo)
   PROMPT_SERVER_URL=http://localhost:3001
   PROMPT_API_KEY=...
   ```

4. **Inicializar la base de datos**
   ```bash
   npm run init-db
   ```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

## 📡 Endpoints

### GET /many
Obtiene todos los tickers con precios del mercado argentino a partir de fuentes públicas disponibles en la web.

**Respuesta:**
```json
{
  "YPFD": "45725",
  "ALUA": "731",
  "TECO2": "2690",
  "PAMP": "4010",
  "TXAR": "633",
  "DESP": "",
  "INTC": "5350",
  "CRES": "1465",
  "SUPV": "2925",
  "BPOD7": "128330",
  "LOMA": "3050",
  "BBV": "24775",
  "TSLA": "29275",
  "AL30": "80400",
  "STLA": "2490",
  "IWM": "29400",
  "GLOB": "5590",
  "NKE": "8260",
  "GGAL": "6780",
  "MELI": "26150",
  "CRM": "17850",
  "NVDA": "10125",
  "TEN": "47775",
  "AL41": "79980",
  "MSFT": "23150",
  "SPY": "42450",
  "AAPL": "15300",
  "DISN": "12450",
  "oficial": 1310,
  "blue": 1315,
  "bolsa": 1331.7,
  "contadoconliqui": 1328.25
}
```

### GET /manycsv
Igual que `GET /many` pero devuelve los datos en formato CSV.

**Respuesta:** `text/csv` con headers y una fila por ticker.

---

### GET /manyall
Igual que `GET /many` pero los precios de los tickers se devuelven como `{ ars, usd }` en lugar de un número plano. `usd = ars / bolsa`, redondeado a 4 decimales. Los tipos de cambio siguen siendo números planos.

**Respuesta:**
```json
{
  "GGAL": { "ars": 6780, "usd": 5.0904 },
  "oficial": 1310,
  "blue": 1315,
  "bolsa": 1331.7,
  "contadoconliqui": 1328.25
}
```

---

### GET /manysave
Igual que `GET /many` + persiste un `PriceSnapshot` por ticker y un `DollarSnapshot` en MongoDB para tracking histórico.

---

### GET /manyhistory/:date
Devuelve precios históricos para una fecha dada en el mismo formato que `/manyall`.

**Parámetros:**
- `date` (path) — Fecha en formato `YYYY-MM-DD` (UTC)

**Respuesta:** Los tickers devuelven `{ ars: number | null, usd: number | null }`. Los tipos de cambio devuelven un número plano o `null` si no hay datos para esa fecha.

---

### POST /add
Agrega un nuevo ticker a la base de datos.

**Body:**
```json
{
  "symbol": "NUEVO_TICKER"
}
```

**Respuesta:**
```json
{
  "message": "Ticker NUEVO_TICKER agregado exitosamente",
  "ticker": {
    "symbol": "NUEVO_TICKER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /remove
Remueve un ticker de la base de datos.

**Body:**
```json
{
  "symbol": "TICKER_A_REMOVER"
}
```

**Respuesta:**
```json
{
  "message": "Ticker TICKER_A_REMOVER removido exitosamente"
}
```

### GET /news

Devuelve 5 artículos de noticias curados por LLM, seleccionados como los más relevantes para un inversor argentino.

**Respuesta:**
```json
[
  {
    "title": "string",
    "url": "string",
    "source": "string",
    "publishedAt": "2024-01-01T00:00:00Z",
    "category": "global | argentina | geopolitics | watchlist",
    "summary": "### Título\n\nPárrafo 1...\n\nPárrafo 2..."
  }
]
```

**Flujo interno:**
1. Fetcha ~40 artículos de NewsAPI en paralelo (4 categorías)
2. Deduplica por URL y filtra fuentes en blacklist
3. Pasa los títulos a Groq LLM para seleccionar los 5 índices más relevantes
4. Para cada artículo seleccionado, extrae el contenido con Jina y genera un resumen en markdown vía Groq

**Variables de entorno requeridas:** `NEWS_API_KEY`, `GROQ_API_KEY`, `PROMPT_SERVER_URL`, `PROMPT_API_KEY`

---

### GET /health
Verifica el estado del servidor.

**Respuesta:**
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 Ejemplos de uso

### Usando curl

```bash
# Obtener todos los tickers
curl http://localhost:3000/many

# Agregar un nuevo ticker
curl -X POST http://localhost:3000/add \
  -H "Content-Type: application/json" \
  -d '{"symbol": "GOOGL"}'

# Remover un ticker
curl -X POST http://localhost:3000/remove \
  -H "Content-Type: application/json" \
  -d '{"symbol": "GOOGL"}'

# Verificar salud del servidor
curl http://localhost:3000/health
```

### Usando JavaScript/Fetch

```javascript
// Obtener tickers
const response = await fetch('http://localhost:3000/many');
const tickers = await response.json();

// Agregar ticker
const addResponse = await fetch('http://localhost:3000/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbol: 'GOOGL' })
});

// Remover ticker
const removeResponse = await fetch('http://localhost:3000/remove', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbol: 'GOOGL' })
});
```

## 📁 Estructura del proyecto

```
src/
├── config/
│   └── database.ts          # Configuración de MongoDB
├── controllers/
│   └── tickerController.ts  # Controladores de la API
├── models/
│   └── Ticker.ts           # Modelo de Mongoose
├── routes/
│   └── tickerRoutes.ts     # Definición de rutas
├── scripts/
│   └── initDb.ts           # Script de inicialización
├── services/
│   └── tickerService.ts    # Lógica de negocio
└── index.ts                # Punto de entrada
```

## 🔧 Scripts disponibles

- `npm run dev`: Ejecuta en modo desarrollo con hot reload
- `npm run build`: Compila TypeScript a JavaScript
- `npm start`: Ejecuta la aplicación compilada
- `npm run init-db`: Inicializa la base de datos con tickers de ejemplo

## 🐛 Solución de problemas

### Error de conexión a MongoDB
Asegúrate de que MongoDB esté ejecutándose:
```bash
# En Windows
net start MongoDB

# En macOS/Linux
sudo systemctl start mongod
```

### Puerto ocupado
Cambia el puerto en el archivo `.env`:
```
PORT=3001
```

## Integración con Prompt Inventory

Los prompts que usa el endpoint `/news` para interactuar con el LLM se consumen en runtime desde [Prompt Inventory](https://github.com/marcosm121/Prompt-Inventory), un servidor dedicado que permite editar prompts sin necesidad de redeploy.

### Prompts utilizados

| Slug | Función |
|------|---------|
| `seleccion-de-articulos` | Instruye al LLM a elegir los 5 índices más relevantes de una lista de titulares |
| `resumen-de-articulo` | Instruye al LLM a generar un resumen en markdown de un artículo |

El contenido dinámico (lista de títulos, texto del artículo) se appendea al final del prompt en runtime.

### Configuración

Levantá una instancia de [Prompt Inventory](https://github.com/marcosm121/Prompt-Inventory) y configurá las variables en `.env`:

```
PROMPT_SERVER_URL=http://localhost:3001   # URL del servidor de Prompt Inventory
PROMPT_API_KEY=tu-api-key-secreta         # Debe coincidir con API_KEY en Prompt Inventory
```

Luego creá los dos prompts desde la UI de Prompt Inventory usando los slugs `seleccion-de-articulos` y `resumen-de-articulo`.

---

## 📝 Notas

- Los precios se obtienen del mercado argentino a partir de fuentes públicas disponibles en la web
- Los tickers se almacenan en mayúsculas automáticamente
- La base de datos incluye tickers de ejemplo al inicializar
- CORS está habilitado para desarrollo frontend
