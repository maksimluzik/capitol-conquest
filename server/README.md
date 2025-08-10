# Capitol Conquest Multiplayer Server

Example Express + Socket.io server providing matchmaking and real-time turn synchronization for the Phaser game.

## Running

```
cd server
npm install
node index.js
```

The server assigns players into rooms, relays moves and handles simple reconnect logic. Persisting state or advanced validation can be layered on top.
