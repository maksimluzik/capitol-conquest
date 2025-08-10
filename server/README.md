# Capitol Conquest Multiplayer Server

## Quick Start

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Server will run on:**
   - Local: http://localhost:3001
   - Health check: http://localhost:3001/health

## Environment Variables

- `NODE_ENV`: Set to 'production' for production deployment
- `PORT`: Server port (default: 3001)

## Features

- Real-time multiplayer gameplay using Socket.IO
- Automatic matchmaking
- Game state synchronization
- Move validation
- Chat system
- Disconnection handling
- Security measures (CORS, rate limiting, helmet)

## Game Room Management

- Players are automatically matched when joining
- Game rooms are created for each pair of players
- Inactive games are cleaned up after 10 minutes
- Players can reconnect to existing games

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and current player/game counts.

## Socket Events

### Client → Server
- `joinGame`: Join matchmaking queue
- `makeMove`: Send a game move
- `chatMessage`: Send chat message

### Server → Client
- `gameStarted`: Game begins with initial state
- `waitingForOpponent`: Player in queue
- `moveMade`: Move accepted and broadcasted
- `moveRejected`: Invalid move
- `playerDisconnected`: Opponent left
- `chatMessage`: Chat message received

## Deployment

### Heroku
1. Create a new Heroku app
2. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   ```
3. Deploy:
   ```bash
   git push heroku main
   ```

### Other Platforms
- Update CORS origins in server.js
- Ensure WebSocket support is enabled
- Set NODE_ENV=production

## Security Features

- Helmet.js for security headers
- CORS protection
- Rate limiting (100 requests per 15 minutes)
- Input validation
- Move validation server-side
