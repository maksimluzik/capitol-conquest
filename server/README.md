# Capitol Conquest Multiplayer Server

Example Express + Socket.io server providing matchmaking and real-time turn synchronization for the Phaser game.

## Running

```
cd server
npm install
node server.js
```

For production, use pm2 to always run and start on startup. More info:
https://gist.github.com/maksimluzik/7110e52a936bd9a9b5add04ee69639d6

Backend server provision and setup:
https://gist.github.com/maksimluzik/7110e52a936bd9a9b5add04ee69639d6

The server assigns players into rooms, relays moves and handles simple reconnect logic. Persisting state or advanced validation can be layered on top.
