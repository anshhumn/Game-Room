const socket = io();

// Team login function
function teamLogin() {
    const teamName = document.getElementById("teamName").value;
    const password = document.getElementById("password").value;
    socket.emit('team-joined', { teamName, password });
}

// Host login function
function hostLogin() {
    const hostname = document.getElementById("hostname").value;
    const hostPassword = document.getElementById("hostPassword").value;
    socket.emit('host-joined', { hostname, hostPassword });
}

// Host message handler (login success or failure)
socket.on('host-message', (message) => {
    alert(message);

    // Redirect to host dashboard if host logged in successfully
    if (message.includes('logged in successfully')) {
        window.location.href = 'host-dashboard.html';  // Redirect to host dashboard
    }
});

// Handle successful team login and redirect
socket.on('update-teams', (teams) => {
    const teamName = document.getElementById("teamName").value;
    if (teams[teamName]) {
        window.location.href = 'team-dashboard.html';  // Redirect to team dashboard
    }
});
// Handle team login and redirect to team dashboard
socket.on('host-message', (message) => {
    alert(message);
    if (message.includes('joined')) {
        window.location.href = '/team-dashboard.html';
    }
});
