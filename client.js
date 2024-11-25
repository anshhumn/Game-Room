const socket = io();

// Variables
const hostButton = document.getElementById('host-button');
const teamButton = document.getElementById('team-button');
const startGameButton = document.getElementById('start-game-button');
const attackButton = document.getElementById('attack-button');
const defendButton = document.getElementById('defend-button');
const teamNameInput = document.getElementById('team-name');
const passcodeInput = document.getElementById('passcode-input');
const teamSelect = document.getElementById('team-select');
const messageBox = document.getElementById('message-box');
const healthBar = document.getElementById('team-health-bar');
const actionCount = document.getElementById('action-count');
const gameStatus = document.getElementById('game-status');
const leaderboard = document.getElementById('leaderboard');

let userType = '';
let currentTeam = '';
let gameStarted = false;
let teams = {};
let actionsRemaining = 10;

// Join as Host
hostButton.addEventListener('click', () => {
  const passcode = passcodeInput.value;
  if (passcode === 'password123') {  // Replace with the actual passcode
    userType = 'host';
    socket.emit('host-joined');
    updateUIForHost();
  } else {
    alert('Incorrect passcode!');
  }
});

// Join as Team
teamButton.addEventListener('click', () => {
  const teamName = teamNameInput.value;
  if (teamName) {
    userType = 'team';
    currentTeam = teamName;
    socket.emit('team-joined', { teamName });
    updateUIForTeam();
  } else {
    alert('Please enter a team name.');
  }
});

// Start Game
startGameButton.addEventListener('click', () => {
  socket.emit('start-game');
});

// Attack
attackButton.addEventListener('click', () => {
  const targetId = teamSelect.value;
  if (targetId && gameStarted && actionsRemaining > 0) {
    socket.emit('attack', targetId);
    actionsRemaining--;
    updateActionCount();
  }
});

// Defend
defendButton.addEventListener('click', () => {
  if (gameStarted && actionsRemaining > 0) {
    socket.emit('defend');
    actionsRemaining--;
    updateActionCount();
  }
});

socket.on('game-started', () => {
  gameStarted = true;
  gameStatus.textContent = 'Game has started! You can now attack or defend.';
});

socket.on('host-message', (message) => {
  messageBox.textContent = message;
});

socket.on('update-teams', (updatedTeams) => {
  teams = updatedTeams;
  updateTeamList();
  if (userType === 'host') {
    updateLeaderboard();
  }
});

socket.on('update-stats', (teamStats) => {
  if (userType === 'team' && socket.id === teamStats.id) {
    healthBar.style.width = `${teamStats.health}%`;
  }
});

socket.on('attack-result', (resultMessage) => {
  alert(resultMessage);
});

socket.on('game-over', (message) => {
  alert(message);
  gameStatus.textContent = message;
});

function updateTeamList() {
  teamSelect.innerHTML = '';
  for (const [id, team] of Object.entries(teams)) {
    if (id !== socket.id) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${team.name} (Health: ${team.health})`;
      teamSelect.appendChild(option);
    }
  }
}

function updateLeaderboard() {
  leaderboard.innerHTML = ''; // Clear previous leaderboard
  const sortedTeams = Object.values(teams).sort((a, b) => b.health - a.health); // Sort teams by health (descending)
  
  sortedTeams.forEach(team => {
    const teamElement = document.createElement('div');
    teamElement.textContent = `${team.name}: Health ${team.health}`;
    leaderboard.appendChild(teamElement);
  });
}

function updateUIForHost() {
  // Hide login sections and show host dashboard
  document.getElementById('host-login').style.display = 'none';
  document.getElementById('team-login').style.display = 'none';
  document.getElementById('host-dashboard').style.display = 'block';
  document.getElementById('start-game-button').style.display = 'block';
}

function updateUIForTeam() {
  // Hide login sections and show team dashboard
  document.getElementById('host-login').style.display = 'none';
  document.getElementById('team-login').style.display = 'none';
  document.getElementById('team-dashboard').style.display = 'block';
  document.getElementById('attack-button').style.display = 'block';
  document.getElementById('defend-button').style.display = 'block';
}

function updateActionCount() {
  actionCount.textContent = actionsRemaining;
  if (actionsRemaining <= 0) {
    attackButton.disabled = true;
    defendButton.disabled = true;
    gameStatus.textContent = "You've reached the maximum number of actions.";
  }
}
