const settings = {
            apiKey: 'qFdQvL4jTNcpNZzrzr7GDW7rv',
            stopIds: ['1169', '1225', '7888'],
            refreshInterval: 10000,
            groupSize: 3,
            totalBuses: 6,
            routeColors: {
                A: { circleColor: '#EE3425', textColor: '#FEFEFE' },
                B: { circleColor: '#80BC00', textColor: '#FEFEFE' },
                C: { circleColor: '#333366', textColor: '#FEFEFE' },
                D: { circleColor: '#333366', textColor: '#FEFEFE' },
                E: { circleColor: '#2272B5', textColor: '#FEFEFE' },
                F: { circleColor: '#2272B5', textColor: '#FEFEFE' },
                G: { circleColor: '#2272B5', textColor: '#FEFEFE' },
                H: { circleColor: '#2272B5', textColor: '#FEFEFE' },
                J: { circleColor: '#2272B5', textColor: '#FEFEFE' },
                L: { circleColor: '#C2A3FF', textColor: '#FEFEFE' },
                O: { circleColor: '#C2A3FF', textColor: '#FEFEFE' },
                P: { circleColor: '#2272B5', textColor: '#FEFEFE' },
                R: { circleColor: '#C2A3FF', textColor: '#FEFEFE' },
                S: { circleColor: '#C2A3FF', textColor: '#FEFEFE' },
                W: { circleColor: '#2272B5', textColor: '#FEFEFE' },
                28: { circleColor: '#2272B5', textColor: '#FEFEFE' },
                38: { circleColor: '#2272B5', textColor: '#FEFEFE' },
                55: { circleColor: '#C2A3FF', textColor: '#FEFEFE' },
                65: { circleColor: '#C2A3FF', textColor: '#FEFEFE' },
                75: { circleColor: '#C2A3FF', textColor: '#FEFEFE' },
                80: { circleColor: '#333366', textColor: '#FEFEFE' },
                81: { circleColor: '#333366', textColor: '#FEFEFE' },
                82: { circleColor: '#333366', textColor: '#FEFEFE' },
                84: { circleColor: '#333366', textColor: '#FEFEFE' },
                60: { circleColor: '#520298', textColor: '#FEFEFE' },
                61: { circleColor: '#951F20', textColor: '#FEFEFE' },
                62: { circleColor: '#025806', textColor: '#FEFEFE' },
                63: { circleColor: '#2E3192', textColor: '#FEFEFE' },
                64: { circleColor: '#646464', textColor: '#FEFEFE' },
            },
            weatherApiKey: '3027d03aa4e945c2be314310250411',
            weatherLocation: 'Madison,WI'
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

            const busesToDisplay = buses.slice(0, settings.totalBuses);

            for (let i = currentIndex; i < currentIndex + settings.groupSize; i++) {
                const bus = busesToDisplay[i % busesToDisplay.length];
                const routeColors = settings.routeColors[bus.route] || { circleColor: '#000000', textColor: '#FFFFFF' };

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

        async function updateWeather() {
            const url = `https://api.weatherapi.com/v1/current.json?key=${settings.weatherApiKey}&q=${encodeURIComponent(settings.weatherLocation)}&aqi=no`;
            try {
                const response = await fetch(url);
                const data = await response.json();

                const tempF = Math.round(data.current.temp_f);
                const iconUrl = "https:" + data.current.condition.icon;

                document.getElementById('weatherTemp').textContent = `${tempF}°`;
                document.getElementById('weatherIcon').src = iconUrl;
            } catch (error) {
                console.error("Weather fetch failed:", error);
            }

            setTimeout(updateWeather, 600000);

        refreshBusData();
        updateWeather();
