const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const teams = {
    teamA: { name: 'Team A', health: 100, attacks: { 'Shadow Intrusion': 6, 'Vault Breaker': 5 }, password: 'teamApass' },
    teamB: { name: 'Team B', health: 100, attacks: { 'System Flood': 3, 'Swarm Overloaded': 2 }, password: 'teamBpass' },
};

let gameStarted = false;
let connectedTeams = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle team joining
    socket.on('team-joined', ({ teamName, password }) => {
        if (teams[teamName] && teams[teamName].password === password) {
            connectedTeams[socket.id] = teamName;
            socket.emit('update-teams', teams);
            io.emit('host-message', `${teamName} has joined the game`);
        } else {
            socket.emit('host-message', 'Invalid team credentials');
        }
    });

    // Handle host login
    socket.on('host-joined', ({ hostname, hostPassword }) => {
        if (hostname === 'me' && hostPassword === '1234') {
            socket.emit('host-message', 'Host logged in successfully!');
        } else {
            socket.emit('host-message', 'Invalid host credentials');
        }
    });

    // Update teams when host clicks 'Start Game'
    socket.on('start-game', () => {
        if (Object.keys(connectedTeams).length < 2) {
            socket.emit('host-message', 'Not enough teams to start the game');
            return;
        }

        gameStarted = true;
        io.emit('game-started');
        io.emit('host-message', 'Game has started!');
    });

    // Attack handling (when game starts)
    socket.on('attack', (targetTeamName, attackType) => {
        if (!gameStarted) {
            socket.emit('game-not-started');
            return;
        }

        // Attack logic here (for simplicity, reduce health)
        const attackerTeamName = connectedTeams[socket.id];
        if (attackerTeamName && teams[attackerTeamName].attacks[attackType]) {
            const attackPower = teams[attackerTeamName].attacks[attackType];
            if (teams[targetTeamName]) {
                teams[targetTeamName].health -= attackPower;
                if (teams[targetTeamName].health < 0) {
                    teams[targetTeamName].health = 0;
                }
                io.emit('team-health-update', teams);
                io.emit('attack-update', `${attackerTeamName} attacked ${targetTeamName} using ${attackType}`);
            }
        }
    });

    // End the game
    socket.on('game-over', () => {
        gameStarted = false;
        io.emit('host-message', 'Game Over!');
        io.emit('game-over');
    });

    socket.on('disconnect', () => {
        delete connectedTeams[socket.id];
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
