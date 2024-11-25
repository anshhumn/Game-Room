const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let teams = {};
let gameStarted = false;  // To track if the game has started

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('host-joined', () => {
    console.log('Host has joined');
  });

  socket.on('team-joined', ({ teamName }) => {
    teams[socket.id] = { name: teamName, health: 100, attackPoints: 10, defendPoints: 10 };
    console.log(`${teamName} joined.`);
    io.emit('update-teams', teams);
  });

  socket.on('start-game', () => {
    gameStarted = true;
    io.emit('game-started');  // Notify all teams
    io.emit('host-message', 'Host has started the game. You may now attack.');
  });

  socket.on('host-message', (message) => {
    socket.broadcast.emit('host-message', message);
  });

  socket.on('attack', (targetId) => {
    if (gameStarted && teams[socket.id] && teams[targetId]) {
      // Check if both teams exist and the target is not the same team
      if (targetId !== socket.id) {
        let damage = 10;  // Default attack damage
        teams[targetId].health -= damage;

        // Ensure health doesn't go below 0
        if (teams[targetId].health < 0) {
          teams[targetId].health = 0;
        }

        // Notify the attacked team and the host
        io.to(targetId).emit('update-stats', teams[targetId]);
        io.to(socket.id).emit('attack-result', 'Attack successful!');
        io.emit('update-teams', teams);

        // Check for game over condition
        checkGameOver();
      }
    }
  });

  socket.on('defend', () => {
    if (gameStarted && teams[socket.id]) {
      teams[socket.id].health += 10;  // Defend increases health by 10
      // Ensure health doesn't exceed 100
      if (teams[socket.id].health > 100) {
        teams[socket.id].health = 100;
      }
      io.to(socket.id).emit('update-stats', teams[socket.id]);
      io.emit('update-teams', teams);
    }
  });
});

function checkGameOver() {
  // Check if only one team has health > 0
  const aliveTeams = Object.values(teams).filter(team => team.health > 0);
  if (aliveTeams.length === 1) {
    io.emit('game-over', `The winner is ${aliveTeams[0].name}! Congratulations!`);
    gameStarted = false;
  }
}

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
