
        // --- VARIABLES GLOBALES ---
        let currentTab = 'wiki';
        let apiKey = localStorage.getItem('my_gemini_key') || '';
        
        // Coordenadas fijas para ciudades
        const cityCoords = {
            'Madrid': { lat: 40.41, lon: -3.7 },
            'Mexico City': { lat: 19.43, lon: -99.13 },
            'Buenos Aires': { lat: -34.60, lon: -58.38 },
            'Bogotá': { lat: 4.60, lon: -74.08 },
            'New York': { lat: 40.71, lon: -74.00 },
            'Tokyo': { lat: 35.68, lon: 139.76 },
            'London': { lat: 51.50, lon: -0.12 },
        };

        // --- INICIALIZACIÓN ---
        document.addEventListener('DOMContentLoaded', () => {
            // Inicializar iconos
            lucide.createIcons();
            
            // Cargar API Key
            document.getElementById('api-key-input').value = apiKey;

            // Verificar conexión
            updateConnectionStatus();
            window.addEventListener('online', updateConnectionStatus);
            window.addEventListener('offline', updateConnectionStatus);
        });

        // --- UI UTILS ---
        function updateConnectionStatus() {
            const indicator = document.getElementById('status-indicator');
            const text = document.getElementById('status-text');
            if (navigator.onLine) {
                indicator.className = "w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]";
                text.innerText = "CONECTADO";
            } else {
                indicator.className = "w-2 h-2 rounded-full bg-red-500";
                text.innerText = "SIN CONEXIÓN";
            }
        }

        function switchTab(tab) {
            currentTab = tab;
            
            // Actualizar botones Sidebar
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.className = "nav-btn w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group hover:bg-slate-900 text-slate-400 hover:text-white border border-transparent";
                const label = btn.querySelector('.font-medium');
                if (label) label.classList.remove('text-blue-100');
            });

            const activeBtn = document.getElementById(`btn-${tab}`);
            activeBtn.className = "nav-btn w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group bg-blue-600/10 text-blue-400 border border-blue-600/20";
            
            // Ocultar todas las secciones
            document.getElementById('section-wiki').classList.add('hidden');
            document.getElementById('section-weather').classList.add('hidden');
            document.getElementById('section-chat').classList.add('hidden');

            // Mostrar sección activa
            const activeSection = document.getElementById(`section-${tab}`);
            activeSection.classList.remove('hidden');
            activeSection.classList.add('fade-in'); // Re-trigger animación

            // Actualizar Header
            const titles = {
                'wiki': 'Explorador de Conocimiento (Wikipedia API)',
                'weather': 'Meteorología en Tiempo Real (OpenMeteo API)',
                'chat': 'Asistente IA (Gemini API)'
            };
            document.getElementById('header-title').innerText = titles[tab];

            // Si es clima, cargar datos iniciales si no existen
            if (tab === 'weather') {
                fetchWeather();
            }
        }

        function toggleSettings() {
            const modal = document.getElementById('settings-modal');
            modal.classList.toggle('hidden');
        }

        function saveSettings() {
            const input = document.getElementById('api-key-input');
            apiKey = input.value.trim();
            localStorage.setItem('my_gemini_key', apiKey);
            toggleSettings();
            
            // Actualizar placeholder chat
            document.getElementById('chat-input').placeholder = apiKey ? "Escribe un mensaje..." : "Configura tu API Key primero...";
        }

        // --- WIKIPEDIA LOGIC ---
        async function searchWiki(e) {
            e.preventDefault();
            const query = document.getElementById('wiki-input').value.trim();
            if (!query) return;

            const loading = document.getElementById('wiki-loading');
            const resultsDiv = document.getElementById('wiki-results');
            
            loading.classList.remove('hidden');
            resultsDiv.innerHTML = '';

            try {
                const endpoint = `https://es.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=10&srsearch=${encodeURIComponent(query)}`;
                const response = await fetch(endpoint);
                const data = await response.json();

                loading.classList.add('hidden');

                if (data.query && data.query.search && data.query.search.length > 0) {
                    data.query.search.forEach(item => {
                        const div = document.createElement('div');
                        div.className = "bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 p-5 rounded-xl transition-all group";
                        div.innerHTML = `
                            <a href="https://es.wikipedia.org/?curid=${item.pageid}" target="_blank" rel="noopener noreferrer" class="block">
                                <h3 class="text-xl font-bold text-blue-400 group-hover:text-blue-300 mb-2 flex items-center gap-2">
                                    ${item.title}
                                    <i data-lucide="external-link" class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                </h3>
                                <p class="text-slate-300 text-sm leading-relaxed">${item.snippet}...</p>
                            </a>
                        `;
                        resultsDiv.appendChild(div);
                    });
                    lucide.createIcons(); // Refrescar iconos nuevos
                } else {
                    resultsDiv.innerHTML = '<div class="text-center text-slate-500 mt-10"><p>No se encontraron resultados.</p></div>';
                }
            } catch (error) {
                loading.classList.add('hidden');
                resultsDiv.innerHTML = `<div class="p-4 bg-red-900/30 border border-red-800 text-red-200 rounded-lg">Error de conexión: ${error.message}</div>`;
            }
        }

        // --- WEATHER LOGIC ---
        async function fetchWeather() {
            const city = document.getElementById('city-select').value;
            const coords = cityCoords[city];
            
            const loading = document.getElementById('weather-loading');
            const content = document.getElementById('weather-content');
            
            loading.classList.remove('hidden');
            content.classList.add('opacity-50'); // Dim effect

            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
                const data = await res.json();
                
                loading.classList.add('hidden');
                content.classList.remove('opacity-50');

                document.getElementById('weather-temp').innerText = Math.round(data.current_weather.temperature) + '°';
                document.getElementById('weather-wind').innerText = data.current_weather.windspeed + ' km/h';
                document.getElementById('weather-min').innerText = data.daily.temperature_2m_min[0] + '°';
                document.getElementById('weather-lat').innerText = coords.lat;

            } catch (error) {
                loading.classList.add('hidden');
                console.error(error);
            }
        }

        // --- CHAT LOGIC ---
        async function sendChatMessage(e) {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const text = input.value.trim();
            const messagesDiv = document.getElementById('chat-messages');
            const typingIndicator = document.getElementById('chat-typing');

            if (!text) return;

            if (!apiKey) {
                appendMessage('system', '⚠️ Error: No has configurado una API Key. Ve a configuración (⚙️) y añade tu clave.');
                input.value = '';
                return;
            }

            // User Message
            appendMessage('user', text);
            input.value = '';
            
            // Scroll to bottom
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            typingIndicator.classList.remove('hidden');

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: text }] }]
                    })
                });

                const data = await response.json();
                typingIndicator.classList.add('hidden');

                if (data.error) throw new Error(data.error.message);
                
                const botText = data.candidates[0].content.parts[0].text;
                appendMessage('bot', botText);

            } catch (error) {
                typingIndicator.classList.add('hidden');
                appendMessage('system', `Error: ${error.message}`);
            }
        }

        function appendMessage(role, text) {
            const messagesDiv = document.getElementById('chat-messages');
            const div = document.createElement('div');
            
            // Clases según rol
            const alignClass = role === 'user' ? 'justify-end' : 'justify-start';
            let bgClass = '';
            if (role === 'user') bgClass = 'bg-blue-600 text-white rounded-br-none';
            else if (role === 'system') bgClass = 'bg-yellow-900/20 text-yellow-200 border border-yellow-800/50';
            else bgClass = 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700';

            // Formateo básico de markdown para el bot
            let contentHtml = text;
            if (role === 'bot') {
                // Convertir saltos de línea a <br> y negritas simples
                contentHtml = text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
                contentHtml = `<div class="prose text-sm">${contentHtml}</div>`;
            }

            div.className = `flex ${alignClass}`;
            div.innerHTML = `
                <div class="max-w-[80%] rounded-2xl p-4 ${bgClass}">
                    ${contentHtml}
                </div>
            `;
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

  