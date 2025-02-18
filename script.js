const settings = {
    apiKey: 'qFdQvL4jTNcpNZzrzr7GDW7rv',
    stopIds: ['1169', '1225', '7888'],
    refreshInterval: 5000,
    groupSize: 3,  // Display 3 buses at a time
    totalBuses: 6, // Show only 6 buses, but scroll 3 at a time
    routeColors: {
        A: { circleColor: '#EE3425', textColor: '#FEFEFE' },
        B: { circleColor: '#7DB441', textColor: '#FEFEFE' },
        C: { circleColor: '#333366', textColor: '#FEFEFE' },
        D: { circleColor: '#333366', textColor: '#FEFEFE' },
        E: { circleColor: '#2172B6', textColor: '#FEFEFE' },
        F: { circleColor: '#2172B6', textColor: '#FEFEFE' },
        G: { circleColor: '#2172B6', textColor: '#FEFEFE' },
        H: { circleColor: '#2172B6', textColor: '#FEFEFE' },
        J: { circleColor: '#2172B6', textColor: '#FEFEFE' },
        L: { circleColor: '#47AAD1', textColor: '#FEFEFE' },
        O: { circleColor: '#47AAD1', textColor: '#FEFEFE' },
        P: { circleColor: '#2172B6', textColor: '#FEFEFE' },
        R: { circleColor: '#2172B6', textColor: '#FEFEFE' },
        S: { circleColor: '#47AAD1', textColor: '#FEFEFE' },
        W: { circleColor: '#2172B6', textColor: '#FEFEFE' },
        28: { circleColor: '#2172B6', textColor: '#FEFEFE' },
        38: { circleColor: '#2172B6', textColor: '#FEFEFE' },
        55: { circleColor: '#FEFEFE', textColor: '#47AAD1' },
        65: { circleColor: '#FEFEFE', textColor: '#47AAD1' },
        75: { circleColor: '#FEFEFE', textColor: '#47AAD1' },
        80: { circleColor: '#333366', textColor: '#FEFEFE' },
        81: { circleColor: '#333366', textColor: '#FEFEFE' },
        82: { circleColor: '#333366', textColor: '#FEFEFE' },
        84: { circleColor: '#333366', textColor: '#FEFEFE' },
        60: { circleColor: '#FEFEFE', textColor: '#D7B784' },
        61: { circleColor: '#FEFEFE', textColor: '#D7B784' },
        62: { circleColor: '#FEFEFE', textColor: '#D7B784' },
        63: { circleColor: '#FEFEFE', textColor: '#D7B784' },
        64: { circleColor: '#FEFEFE', textColor: '#D7B784' },
    }
};

let currentIndex = 0;

async function getBusData() {
    const stopIds = settings.stopIds.join(',');
    const url = `https://corsproxy.io/?https://metromap.cityofmadison.com/bustime/api/v3/getpredictions?key=${settings.apiKey}&stpid=${stopIds}&format=json`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data['bustime-response']?.prd || [];
    } catch (error) {
        console.error('Error fetching bus data:', error);
        return [];
    }
}

function parseBusData(data) {
    const now = new Date();
    return data
        .map(entry => {
            const arrivalTime = new Date(
                entry.prdtm.replace(/^(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2})$/, '$1-$2-$3T$4:$5')
            );
            const minutesUntil = Math.max(0, Math.floor((arrivalTime - now) / 60000));
            return {
                route: entry.rt,
                destination: `${entry.des} (${entry.rtdir})`,
                time: minutesUntil === 0 ? 'DUE' : `${minutesUntil} min`,
                arrivalTime
            };
        })
        .sort((a, b) => a.arrivalTime - b.arrivalTime);
}

function updateDisplay(buses) {
    const busesContainer = document.getElementById('buses');
    busesContainer.innerHTML = '';

    if (buses.length === 0) {
        busesContainer.innerHTML = '<div id="noBusesMessage">No buses available right now.</div>';
        return;
    }

    // Get only the first 6 buses (max 6 buses)
    const busesToDisplay = buses.slice(0, settings.totalBuses);

    // Show 3 buses at a time, and scroll through them
    for (let i = currentIndex; i < currentIndex + settings.groupSize; i++) {
        const bus = busesToDisplay[i % busesToDisplay.length]; // Ensure the index wraps around for scrolling

        const routeColors = settings.routeColors[bus.route] || {
            circleColor: '#000000',
            textColor: '#FFFFFF'
        };

        const busElement = document.createElement('div');
        busElement.className = 'bus-container';
        busElement.innerHTML = `
            <div class="circle" style="background-color: ${routeColors.circleColor}; color: ${routeColors.textColor};">
                ${bus.route}
            </div>
            <div class="destination">${bus.destination}</div>
            <div class="time">${bus.time}</div>
        `;

        busesContainer.appendChild(busElement);
    }

    // Move the index forward by 3 buses (for scrolling)
    currentIndex = (currentIndex + settings.groupSize) % busesToDisplay.length;
}

async function refreshBusData() {
    const busData = await getBusData();
    const parsedData = parseBusData(busData);

    updateDisplay(parsedData);

    const now = new Date();
    const centralTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    document.getElementById('timeDisplay').textContent = centralTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setTimeout(refreshBusData, settings.refreshInterval);
}

refreshBusData();
