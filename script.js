const apiKey = "e782dfae45c44158d07f4430b606b8e3";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const loading = document.getElementById("loading");
const errorMsg = document.getElementById("errorMsg");
const themeToggle = document.getElementById("themeToggle");
const unitToggle = document.getElementById("unitToggle");
const suggestions = document.getElementById("suggestions");
const skeleton = document.getElementById("skeleton");

const mainWeatherSection = document.getElementById("mainWeatherSection");
const extraGridSection = document.getElementById("extraGridSection");
const forecastSection = document.getElementById("forecastSection");
const hourlySection = document.getElementById("hourlySection");

const cityName = document.getElementById("cityName");
const dateTime = document.getElementById("dateTime");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const conditionBadge = document.getElementById("conditionBadge");
const description = document.getElementById("description");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const pressure = document.getElementById("pressure");
const weatherTip = document.getElementById("weatherTip");

const aqiValue = document.getElementById("aqiValue");
const aqiLabel = document.getElementById("aqiLabel");
const pm25 = document.getElementById("pm25");
const pm10 = document.getElementById("pm10");
const co = document.getElementById("co");
const no2 = document.getElementById("no2");

const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");

const historyList = document.getElementById("historyList");
const favoritesList = document.getElementById("favoritesList");
const forecastContainer = document.getElementById("forecastContainer");

let currentUnit = "metric";
let latestCity = "Bhubaneswar";
let latestCurrentData = null;
let latestForecastData = null;
let hourlyChartInstance = null;
let debounceTimer = null;

function showSkeleton(show) {
  skeleton.classList.toggle("hidden", !show);
  mainWeatherSection.classList.toggle("hidden", show);
  extraGridSection.classList.toggle("hidden", show);
  forecastSection.classList.toggle("hidden", show);
  hourlySection.classList.toggle("hidden", show);
}

function formatDateTime() {
  const now = new Date();
  return now.toLocaleString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatTimeFromUnix(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function convertTemp(tempCelsius) {
  if (currentUnit === "imperial") {
    return `${Math.round((tempCelsius * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(tempCelsius)}°C`;
}

function convertWind(speedMs) {
  if (currentUnit === "imperial") {
    return `${(speedMs * 2.237).toFixed(1)} mph`;
  }
  return `${speedMs.toFixed(2)} m/s`;
}

function setDynamicBackground(mainCondition = "") {
  const condition = mainCondition.toLowerCase();

  if (condition.includes("clear")) {
    document.body.style.background = "linear-gradient(135deg, #f59e0b, #f97316)";
  } else if (condition.includes("cloud")) {
    document.body.style.background = "linear-gradient(135deg, #334155, #64748b)";
  } else if (condition.includes("rain") || condition.includes("drizzle")) {
    document.body.style.background = "linear-gradient(135deg, #164e63, #2563eb)";
  } else if (condition.includes("thunderstorm")) {
    document.body.style.background = "linear-gradient(135deg, #111827, #374151)";
  } else if (condition.includes("snow")) {
    document.body.style.background = "linear-gradient(135deg, #7dd3fc, #dbeafe)";
  } else if (condition.includes("mist") || condition.includes("haze") || condition.includes("fog")) {
    document.body.style.background = "linear-gradient(135deg, #475569, #94a3b8)";
  } else {
    document.body.style.background = "linear-gradient(135deg, #081225, #173b8f)";
  }
}

function getWeatherTip(mainCondition, temp) {
  const condition = mainCondition.toLowerCase();

  if (condition.includes("rain")) return "Carry an umbrella today.";
  if (condition.includes("thunderstorm")) return "Avoid open areas during thunderstorms.";
  if (condition.includes("clear") && temp >= 32) return "Hot weather. Stay hydrated and avoid peak afternoon sun.";
  if (condition.includes("clear")) return "Clear sky. Great time for outdoor plans.";
  if (condition.includes("cloud")) return "Comfortable weather with cloud cover.";
  if (condition.includes("mist") || condition.includes("haze")) return "Low visibility possible. Travel carefully.";
  if (condition.includes("snow")) return "Cold day. Wear warm layers.";
  return "Check the forecast before heading out.";
}

function getAqiText(index) {
  const map = {
    1: "Good",
    2: "Fair",
    3: "Moderate",
    4: "Poor",
    5: "Very Poor"
  };
  return map[index] || "--";
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch data");
  }

  return data;
}

async function fetchCurrentWeatherByCity(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  return fetchJson(url);
}

async function fetchCurrentWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  return fetchJson(url);
}

async function fetchForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
  return fetchJson(url);
}

async function fetchAQI(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  return fetchJson(url);
}

async function fetchCitySuggestions(query) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`;
  return fetchJson(url);
}

function displayCurrentWeather(data) {
  latestCurrentData = data;

  cityName.textContent = `${data.name}, ${data.sys.country}`;
  dateTime.textContent = formatDateTime();
  temperature.textContent = convertTemp(data.main.temp);
  conditionBadge.textContent = data.weather[0].main;
  description.textContent = `Condition: ${data.weather[0].description}`;
  feelsLike.textContent = convertTemp(data.main.feels_like);
  humidity.textContent = `${data.main.humidity}%`;
  wind.textContent = convertWind(data.wind.speed);
  pressure.textContent = `${data.main.pressure} hPa`;
  sunrise.textContent = formatTimeFromUnix(data.sys.sunrise);
  sunset.textContent = formatTimeFromUnix(data.sys.sunset);
  weatherTip.textContent = getWeatherTip(data.weather[0].main, data.main.temp);

  const iconCode = data.weather[0].icon;
  weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  weatherIcon.alt = data.weather[0].description;

  setDynamicBackground(data.weather[0].main);
}

function displayAQI(data) {
  const entry = data.list[0];
  aqiValue.textContent = entry.main.aqi;
  aqiLabel.textContent = getAqiText(entry.main.aqi);
  pm25.textContent = entry.components.pm2_5;
  pm10.textContent = entry.components.pm10;
  co.textContent = entry.components.co;
  no2.textContent = entry.components.no2;
}

function displayForecast(data) {
  latestForecastData = data;
  forecastContainer.innerHTML = "";

  const dailyItems = data.list.filter((item) => item.dt_txt.includes("12:00:00"));

  dailyItems.forEach((day) => {
    const dayName = new Date(day.dt_txt).toLocaleDateString("en-IN", {
      weekday: "short"
    });

    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <div class="forecast-day">${dayName}</div>
      <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}">
      <div class="forecast-temp">${convertTemp(day.main.temp)}</div>
      <p>${day.weather[0].main}</p>
    `;
    forecastContainer.appendChild(card);
  });
}

function displayHourlyChart(data) {
  const hourlyItems = data.list.slice(0, 8);
  const labels = hourlyItems.map((item) =>
    new Date(item.dt_txt).toLocaleTimeString("en-IN", { hour: "numeric" })
  );

  const values = hourlyItems.map((item) =>
    currentUnit === "imperial"
      ? Math.round((item.main.temp * 9) / 5 + 32)
      : Math.round(item.main.temp)
  );

  const textColor = document.body.classList.contains("light") ? "#122033" : "#f8fbff";
  const gridColor = document.body.classList.contains("light")
    ? "rgba(18, 32, 51, 0.12)"
    : "rgba(255, 255, 255, 0.16)";

  const ctx = document.getElementById("hourlyChart").getContext("2d");

  if (hourlyChartInstance) {
    hourlyChartInstance.destroy();
  }

  hourlyChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: currentUnit === "imperial" ? "Temperature (°F)" : "Temperature (°C)",
          data: values,
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          backgroundColor: "rgba(255,255,255,0.08)"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        }
      }
    }
  });
}

function saveSearch(city) {
  let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  history = history.filter((item) => item.toLowerCase() !== city.toLowerCase());
  history.unshift(city);

  if (history.length > 6) {
    history.pop();
  }

  localStorage.setItem("weatherHistory", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML = `<p class="muted-text">No recent searches yet.</p>`;
    return;
  }

  history.forEach((city) => {
    const chip = document.createElement("button");
    chip.className = "chip-btn";
    chip.textContent = city;

    chip.addEventListener("click", () => {
      cityInput.value = city;
      handleCitySearch(city);
    });

    chip.addEventListener("dblclick", () => {
      addFavorite(city);
    });

    historyList.appendChild(chip);
  });
}

function addFavorite(city) {
  let favorites = JSON.parse(localStorage.getItem("weatherFavorites")) || [];

  if (!favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem("weatherFavorites", JSON.stringify(favorites));
    renderFavorites();
  }
}

function renderFavorites() {
  const favorites = JSON.parse(localStorage.getItem("weatherFavorites")) || [];
  favoritesList.innerHTML = "";

  if (favorites.length === 0) {
    favoritesList.innerHTML = `<p class="muted-text">Double-click a recent city to favorite it.</p>`;
    return;
  }

  favorites.forEach((city) => {
    const chip = document.createElement("button");
    chip.className = "chip-btn";
    chip.textContent = city;

    chip.addEventListener("click", () => {
      cityInput.value = city;
      handleCitySearch(city);
    });

    favoritesList.appendChild(chip);
  });
}

async function handleCitySearch(city) {
  try {
    latestCity = city;
    showSkeleton(true);
    loading.textContent = "Fetching latest weather...";
    errorMsg.textContent = "";

    const currentData = await fetchCurrentWeatherByCity(city);
    displayCurrentWeather(currentData);

    const forecastData = await fetchForecast(currentData.name);
    displayForecast(forecastData);
    displayHourlyChart(forecastData);

    const aqiData = await fetchAQI(currentData.coord.lat, currentData.coord.lon);
    displayAQI(aqiData);

    saveSearch(currentData.name);
  } catch (error) {
    errorMsg.textContent = error.message;
  } finally {
    showSkeleton(false);
    loading.textContent = "";
  }
}

function handleLocationSearch() {
  if (!navigator.geolocation) {
    errorMsg.textContent = "Geolocation is not supported by your browser.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        showSkeleton(true);
        loading.textContent = "Fetching your location weather...";
        errorMsg.textContent = "";

        const { latitude, longitude } = position.coords;
        const currentData = await fetchCurrentWeatherByCoords(latitude, longitude);
        latestCity = currentData.name;

        displayCurrentWeather(currentData);

        const forecastData = await fetchForecast(currentData.name);
        displayForecast(forecastData);
        displayHourlyChart(forecastData);

        const aqiData = await fetchAQI(latitude, longitude);
        displayAQI(aqiData);

        saveSearch(currentData.name);
      } catch (error) {
        errorMsg.textContent = error.message;
      } finally {
        showSkeleton(false);
        loading.textContent = "";
      }
    },
    () => {
      errorMsg.textContent = "Unable to access your location.";
    }
  );
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "☀️";
  } else {
    themeToggle.textContent = "🌙";
  }
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  themeToggle.textContent = isLight ? "☀️" : "🌙";

  if (latestForecastData) {
    displayHourlyChart(latestForecastData);
  }
});

unitToggle.addEventListener("click", () => {
  currentUnit = currentUnit === "metric" ? "imperial" : "metric";
  unitToggle.textContent = currentUnit === "metric" ? "°F" : "°C";

  if (latestCurrentData) {
    displayCurrentWeather(latestCurrentData);
  }
  if (latestForecastData) {
    displayForecast(latestForecastData);
    displayHourlyChart(latestForecastData);
  }
});

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();

  if (!city) {
    errorMsg.textContent = "Please enter a city name.";
    return;
  }

  handleCitySearch(city);
});

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchBtn.click();
  }
});

locationBtn.addEventListener("click", handleLocationSearch);

cityInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);

  const query = cityInput.value.trim();
  if (query.length < 2) {
    suggestions.style.display = "none";
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      const places = await fetchCitySuggestions(query);
      suggestions.innerHTML = "";

      if (!places.length) {
        suggestions.style.display = "none";
        return;
      }

      places.forEach((place) => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.textContent = `${place.name}, ${place.state ? place.state + ", " : ""}${place.country}`;

        item.addEventListener("click", () => {
          cityInput.value = place.name;
          suggestions.style.display = "none";
          handleCitySearch(place.name);
        });

        suggestions.appendChild(item);
      });

      suggestions.style.display = "block";
    } catch {
      suggestions.style.display = "none";
    }
  }, 400);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-wrapper")) {
    suggestions.style.display = "none";
  }
});

window.addEventListener("load", () => {
  applySavedTheme();
  renderHistory();
  renderFavorites();
  handleCitySearch("Bhubaneswar");
});