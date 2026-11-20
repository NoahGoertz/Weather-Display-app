// HTML elements

const form = document.querySelector("#weather-form");

// Used to get the city name entered by the user
const cityInput = document.querySelector("#city");

// Used to display loading messages and errors
const statusMessage = document.querySelector("#statusMessage");

// Used to show or hide the weather results
const result = document.querySelector("#result");

const locationText = document.querySelector("#location");

const celsiusText = document.querySelector("#celsius");

const fahrenheitText = document.querySelector("#fahrenheit");

// used to disable the search button while fetching data
const searchButton = form.querySelector("button");


// Handle the city search form
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const cityName = cityInput.value.trim(); // get city name
    if (cityName === "") {
        statusMessage.textContent = "Please enter a city.";
        result.hidden = true;
        return;
    }
    // show loading message while fetching data
    statusMessage.textContent = "Loading...";
    result.hidden = true;
    searchButton.disabled = true;

    try {
        // find the coordinates of the city
        // API: Open-Meteo Geocoding API
        const locationUrl = "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(cityName) + "&count=1&language=en&format=json";

        const locationResponse = await fetch(locationUrl);
        if (!locationResponse.ok) {
            throw new Error("City lookup failed.");
        }
        // handle cities that are not found
        const locationData = await locationResponse.json();
        if (!locationData.results || locationData.results.length === 0) {
            statusMessage.textContent = "No city found. Try another name.";
            return;
        }

        const place = locationData.results[0];

        // get the current temperature using city coordinates
        // API: Open-Meteo Forecast API
        const weatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=" +
            place.latitude + "&longitude=" + place.longitude +
            "&current=temperature_2m&temperature_unit=celsius";

        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) {
            throw new Error("Weather lookup failed.");
        }

        const weatherData = await weatherResponse.json();
        const celsius = weatherData.current?.temperature_2m;
        if (typeof celsius !== "number") {
            throw new Error("Temperature data is unavailable.");
        }
        //Convert Celsius to Fahrenheit
        const fahrenheit = celsius * 9 / 5 + 32;

        // display the results on the webpage
        // textContent is used to safely display API data
        locationText.textContent = `${place.name}, ${place.country}`;
        celsiusText.textContent = `${celsius.toFixed(1)} °C`;
        fahrenheitText.textContent = `${fahrenheit.toFixed(1)} °F`;

        result.hidden = false;
        statusMessage.textContent = "Weather loaded.";
    } catch (error) {
        // Handle API and network errors
        statusMessage.textContent = error.message;
        console.error(error);
    } finally {
        // Enable the search button again
        searchButton.disabled = false;
    }
});
