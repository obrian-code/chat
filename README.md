# NodeChat — Chat en Tiempo Real

Chat en tiempo real construido con Node.js, Express y Socket.IO. Mensajería instantánea con indicador de escritura, emojis, compartición de imágenes y notificaciones de conexión.

## Características

- Mensajería en tiempo real via WebSockets
- Indicador de escritura en vivo
- Selector de emojis (+49)
- Compartición de imágenes (base64)
- Estado online/offline con indicadores
- Lista de usuarios conectados
- Sonido al recibir mensajes
- Responsive design (móvil, tablet, escritorio)
- **Persistencia SQLite** — historial de mensajes
- **Seguridad** — Helmet, CORS, rate limiting, sanitización XSS
- **Validación MIME** — solo imágenes permitidas

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express |
| Tiempo real | Socket.IO |
| Frontend | HTML5 + CSS3 + JS vanilla |
| UI | Bootstrap 4 + MDBootstrap |
| BD | SQLite (via sql.js) |
| Seguridad | Helmet, CORS, Rate Limiting |

## Instalación

### Requisitos

- Node.js >= 18
- npm >= 9

### Pasos

```bash
# Clonar repositorio
git clone <url-del-repo>
cd chat

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tu configuración
# NODE_ENV=production
# PORT=3000
# CORS_ORIGIN=http://localhost:3000
# ALLOWED_ORIGINS=http://localhost:3000

# Iniciar servidor
npm start

# O en modo desarrollo
npm run dev
```

Abrir http://localhost:3000 en el navegador.

## Docker

```bash
# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## Variables de Entorno

| Variable | Default | Descripción |
|---|---|---|
| `NODE_ENV` | development | Modo de ejecución |
| `PORT` | 3000 | Puerto del servidor |
| `CORS_ORIGIN` | http://localhost:3000 | Origen permitido |
| `ALLOWED_ORIGINS` | http://localhost:3000 | Orígenes separados por coma |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Ventana de rate limit (ms) |
| `RATE_LIMIT_MAX` | 100 | Máximo de peticiones por ventana |
| `MAX_MESSAGE_LENGTH` | 5000 | Longitud máxima de mensaje |
| `MAX_USERNAME_LENGTH` | 30 | Longitud máxima de username |
| `MAX_FILE_SIZE_MB` | 5 | Tamaño máximo de archivo (MB) |
| `DB_PATH` | ./data/chat.db | Ruta de la base de datos |

## Seguridad

- **Helmet** — Headers HTTP seguros (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** — Orígenes explícitamente configurados
- **Rate Limiting** — Límite de peticiones por ventana (HTTP y WebSocket)
- **Sanitización XSS** — Escape de caracteres especiales en todos los inputs
- **Validación MIME** — Solo imágenes (JPEG, PNG, GIF, WebP, SVG) permitidas
- **Límites de tamaño** — Username, mensaje y archivo limitados
- **Graceful Shutdown** — Cierre limpio de conexiones y BD

## Estructura

```
chat/
├── index.js          # Servidor principal
├── db.js             # Inicialización SQLite
├── package.json
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── Publico/
│   ├── index.html
│   ├── css/
│   │   └── estilo.css
│   ├── js/
│   │   ├── chat.js
│   │   └── emoji.js
│   ├── img/
│   │   └── node.png
│   └── sound/
│       └── inbox.mp3
└── data/
    └── chat.db       # Base de datos SQLite (generada automáticamente)
```

## Eventos Socket.IO

| Evento | Dirección | Descripción |
|---|---|---|
| `chat:name` | Cliente → Servidor | Registrar nombre de usuario |
| `chat:message` | Cliente → Servidor | Enviar mensaje |
| `chat:typing` | Cliente → Servidor | Indicar que está escribiendo |
| `chat:request_users` | Cliente → Servidor | Solicitar lista de usuarios |
| `chat:message` | Servidor → Cliente | Recibir mensaje |
| `chat:is_online` | Servidor → Cliente | Notificación de conexión/desconexión |
| `chat:user_list` | Servidor → Cliente | Lista de usuarios conectados |
| `chat:typing` | Servidor → Cliente | Indicador de escritura |
| `chat:history` | Servidor → Cliente | Historial de mensajes recientes |
| `chat:error` | Servidor → Cliente | Notificación de error |

## Licencia

ISC — Desarrollado por [obrian-code](https://github.com/obrian-code)
