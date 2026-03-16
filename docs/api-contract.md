# API Contract — investorData

Base URL: `http://localhost:3000`

---

## Endpoints

### GET /many

Retorna los precios actuales de todos los tickers y el tipo de cambio del dólar.

**Response `200`**
```json
{
  "GGAL":  "1234.56",
  "YPF":   "8900.00",
  "PAMP":  "3200.50",
  "oficial":         1180.50,
  "blue":            1350.00,
  "bolsa":           1290.75,
  "contadoconliqui": 1310.25
}
```

- Los valores de tickers son **strings** (vienen directo del scraper sin parsear).
- Las tasas de dólar (`oficial`, `blue`, `bolsa`, `contadoconliqui`) son **numbers**.
- Los valores de dólar son el promedio de compra/venta, redondeados a 2 decimales.

> Para recibir todos los valores como `number`, usar `/manyall`.

---

### GET /manycsv

Mismo contenido que `/many` pero en formato CSV descargable.

**Response `200`**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename=datos.csv`

```
Ticker;Valor
GGAL;1234,56
YPF;8900,00
oficial;1180,50
```

> Los decimales usan `,` (coma) en lugar de `.` (punto).

---

### GET /manyall

Retorna los precios actuales de todos los tickers en ARS y USD (cotización bolsa), más las tasas de dólar.

**Response `200`**
```json
{
  "GGAL": { "ars": 1234.56, "usd": 0.9567 },
  "YPF":  { "ars": 8900.00, "usd": 6.8960 },
  "PAMP": { "ars": 3200.50, "usd": 2.4800 },
  "oficial":         1180.50,
  "blue":            1350.00,
  "bolsa":           1290.75,
  "contadoconliqui": 1310.25
}
```

- Los tickers retornan `{ ars: number, usd: number }`.
- `usd = ars / bolsa`, redondeado a 4 decimales.
- Las tasas de dólar (`oficial`, `blue`, `bolsa`, `contadoconliqui`) siguen siendo números planos.

---

### GET /manysave

Igual que `/many`, pero además persiste un snapshot en MongoDB. Usar para registrar precios históricos.

**Response `200`** — mismo shape que `/many`.

> Cada llamada guarda un `DollarSnapshot` y un `PriceSnapshot` por ticker con el timestamp del momento.

---

### GET /manyhistory/:date

Retorna los precios del día indicado según los snapshots guardados con `/manysave`.

**Parámetros**

| Parámetro | Tipo   | Formato    | Ejemplo      |
|-----------|--------|------------|--------------|
| `date`    | string | YYYY-MM-DD | `2026-03-15` |

**Response `200`** — mismo shape que `/manyall`, con `null` en los campos sin datos para esa fecha.

```json
{
  "GGAL": { "ars": 1234.56, "usd": 0.9567 },
  "YPF":  { "ars": null, "usd": null },
  "oficial":         1180.50,
  "blue":            null,
  "bolsa":           1290.75,
  "contadoconliqui": null
}
```

**Response `400`** — formato de fecha inválido.

```json
{
  "error": "Formato de fecha inválido",
  "message": "Usar formato YYYY-MM-DD, ej: 2026-03-15"
}
```

> Las fechas se tratan como días UTC (00:00:00 a 23:59:59 UTC).

---

### POST /add

Agrega un nuevo ticker al listado.

**Body** `application/json`
```json
{ "symbol": "GGAL" }
```

**Response `201`**
```json
{
  "message": "Ticker GGAL agregado exitosamente",
  "ticker": {
    "symbol": "GGAL",
    "createdAt": "2026-03-15T17:00:00.000Z"
  }
}
```

**Response `400`** — falta el campo `symbol`.

**Response `409`** — el ticker ya existe.

---

### POST /remove

Remueve un ticker del listado.

**Body** `application/json`
```json
{ "symbol": "GGAL" }
```

**Response `200`**
```json
{ "message": "Ticker GGAL removido exitosamente" }
```

**Response `400`** — falta el campo `symbol`.

**Response `404`** — el ticker no existe.

---

## Errores genéricos

Todos los endpoints pueden retornar `500` ante un error interno:

```json
{
  "error": "Error interno del servidor",
  "message": "descripción del error"
}
```
