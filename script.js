
const DEFAULT_CITY = "44.85,65.50";
const CITY_STORAGE_KEY = "qazaqWeatherCity";

// Ауа райы API мекенжайы
function getApiUrl() {
    const select = document.getElementById("city-select");

    const coordinates =
        select?.value ||
        localStorage.getItem(CITY_STORAGE_KEY) ||
        DEFAULT_CITY;

    const [latitude, longitude] = coordinates.split(",");

    return (
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${latitude}&longitude=${longitude}` +
        "&current=temperature_2m,relative_humidity_2m," +
        "apparent_temperature,precipitation,weather_code,wind_speed_10m" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
        "&forecast_days=7" +
        "&timezone=Asia%2FAlmaty"
    );
}

// Сақталған қаланы бастапқыда таңдау
function restoreCity() {
    const select = document.getElementById("city-select");
    if (!select) return;

    const savedCity = localStorage.getItem(CITY_STORAGE_KEY);

    if (
        savedCity &&
        Array.from(select.options).some(option => option.value === savedCity)
    ) {
        select.value = savedCity;
    }

    updateCityName();
}

// Қала атауын көрсету
function updateCityName() {
    const select = document.getElementById("city-select");
    const title = document.getElementById("city-name");

    if (select && title) {
        const cityName =
            select.options[select.selectedIndex].text;

        title.textContent = cityName + " қаласы";
    }
}

// Ауа райы сипаттамасы
function weatherDescription(code) {
    if (code === 0) return "Ашық күн ☀️";
    if (code === 1) return "Көбіне ашық 🌤️";
    if (code === 2) return "Ала бұлтты ⛅";
    if (code === 3) return "Бұлтты ☁️";
    if ([45, 48].includes(code)) return "Тұман 🌫️";
    if ([51, 53, 55, 56, 57].includes(code))
        return "Сіркіреме жаңбыр 🌦️";
    if ([61, 63, 65, 66, 67].includes(code))
        return "Жаңбыр 🌧️";
    if ([71, 73, 75, 77].includes(code))
        return "Қар жауады ❄️";
    if ([80, 81, 82].includes(code))
        return "Нөсер жаңбыр 🌧️";
    if ([85, 86].includes(code))
        return "Қарлы боран 🌨️";
    if ([95, 96, 99].includes(code))
        return "Найзағай ⛈️";

    return "Ауа райы белгісіз";
}

function rounded(value) {
    return value == null ? "—" : Math.round(value);
}

// Қазіргі ауа райы
async function loadWeather() {
    const status = document.getElementById("status");

    try {
        status.textContent = "Ауа райы жүктелуде...";

        const response = await fetch(getApiUrl());

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        const current = data.current;

        document.getElementById("temperature").textContent =
            rounded(current.temperature_2m) + "°C";

        document.getElementById("description").textContent =
            weatherDescription(current.weather_code);

        document.getElementById("humidity").textContent =
            (current.relative_humidity_2m ?? "—") + "%";

        document.getElementById("wind").textContent =
            rounded(current.wind_speed_10m) + " км/сағ";

        document.getElementById("rain").textContent =
            (current.precipitation ?? "—") + " мм";

        document.getElementById("feels").textContent =
            rounded(current.apparent_temperature) + "°C";

        status.textContent =
            "Соңғы дерек: " + current.time.replace("T", " ");

    } catch (error) {
        status.textContent =
            "Ауа райы жүктелмеді. Интернетті тексеріңіз.";

        console.error("Ауа райы қатесі:", error);
    }
}

// 7 күндік болжам
async function loadForecast() {
    const forecastList = document.getElementById("forecast-list");

    try {
        forecastList.innerHTML = "<p>Болжам жүктелуде...</p>";

        const response = await fetch(getApiUrl());

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        const daily = data.daily;

        forecastList.innerHTML = "";

        for (let i = 0; i < daily.time.length; i++) {
            const dateText =
                daily.time[i].slice(8, 10) + "." +
                daily.time[i].slice(5, 7);

            const card = document.createElement("div");
            card.className = "forecast-day";

            const date = document.createElement("h3");
            date.textContent = dateText;

            const description = document.createElement("p");
            description.textContent =
                weatherDescription(daily.weather_code[i]);

            const temperature = document.createElement("p");
            temperature.textContent =
                `🌡️ ${rounded(daily.temperature_2m_max[i])}° / ` +
                `${rounded(daily.temperature_2m_min[i])}°`;

            const rain = document.createElement("p");
            const chance = daily.precipitation_probability_max[i];

            rain.textContent =
                "🌧️ Жауын-шашын ықтималдығы: " +
                (chance == null ? "—" : chance + "%");

            card.append(date, description, temperature, rain);
            forecastList.appendChild(card);
        }

    } catch (error) {
        forecastList.innerHTML =
            "<p>Болжам жүктелмеді. Интернетті тексеріңіз.</p>";

        console.error("Болжам қатесі:", error);
    }
}

// Қала таңдалғанда сақтау және деректерді жаңарту
const citySelect = document.getElementById("city-select");

if (citySelect) {
    citySelect.addEventListener("change", async () => {
        localStorage.setItem(CITY_STORAGE_KEY, citySelect.value);
        updateCityName();

        await Promise.all([
            loadWeather(),
            loadForecast()
        ]);
    });
}

// Жаңарту батырмасы
const refreshButton = document.getElementById("refresh");

if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
        await Promise.all([
            loadWeather(),
            loadForecast()
        ]);
    });
}

// Сайтты ашқанда
restoreCity();

loadWeather();
loadForecast();
