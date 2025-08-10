# API de Datos de Inversiones

Backend en Node.js con TypeScript que expone endpoints para gestionar tickers de acciones y obtener precios.

## 🚀 Características

- **GET /many**: Obtiene todos los tickers con precios aleatorios
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
Obtiene todos los tickers con precios aleatorios.

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

## 📝 Notas

- Los precios son generados aleatoriamente para demostración
- Los tickers se almacenan en mayúsculas automáticamente
- La base de datos incluye tickers de ejemplo al inicializar
- CORS está habilitado para desarrollo frontend
