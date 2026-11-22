
//html elements
const showGraphBtn = document.querySelector('#showGraph');
const timeFrame = document.querySelector('#timeFrame');
const graph = document.querySelector('#graph');
const chartStatusMessage = document.querySelector('#chartStatusMessage');

// elements from app.js
const locationText = document.querySelector('#location');
const resultSection = document.querySelector('#result');

let enableChart = false;
let weatherChart = null;

// Get the disired number of days to diplay from the radio buttons
function getNumDays(){
    const days = timeFrame.querySelector('input[name="timeFrame"]:checked');
    return days ? Number(days.value) : 7;
}

// Clear the graph
function clearGraph(){
    if(weatherChart){
        weatherChart.destroy();
        weatherChart = null;
    }
    graph.removeAttribute("aria-label");
}

//Get the inputed city
function getCity(){
    if(!locationText.textContent.trim()) return "";
    return locationText.textContent.split(",")[0].trim();
}

//toggle showing the past weather graph
showGraphBtn.addEventListener("click", async () => {

    // check if a city has been entered yet
    const city = getCity();
    if(!city){
        chartStatusMessage.textContent = "Search for a city to display its past weather.";
        return;
    }

    //graph will be disabled by default
    enableChart = !enableChart;

    //update button label for current state
    showGraphBtn.textContent = enableChart ? "Hide past weather graph" : "Show past weather graph";

    //clear the graph if turned off
    if(!enableChart){
        clearGraph();
        chartStatusMessage.textContent = "Enter a city and enable chart to see graph.";
        return;
    }    
    //redraw the graph with selected days
    await updateGraph(city, getNumDays());
});

// add listener to see if radio btn has changed 
timeFrame.addEventListener("change", async (event) => {
    const city = getCity();

    // make sure chart is enabled and city is set then update graph with new selection
    if(event.target.name === "timeFrame" && enableChart && city !== ""){
        await updateGraph(city, event.target.value);
    }
});

// format the date so it works in the url
function formatDate(date){
    const year = date.getFullYear();

    //padding is needed for single digit values so 2026-1-4 becomes 2026-01-04
    const month = String((date.getMonth() + 1)).padStart(2,"0");
    const day = String(date.getDate()).padStart(2,"0");
    return `${year}-${month}-${day}`
}

// Update and display the graph
async function updateGraph(city, days) {
    chartStatusMessage.textContent = `Loading ${days} days of past weather`;

    try{
        // get the coordinates of the city
        const locationUrl = "https://geocoding-api.open-meteo.com/v1/search?name=" + 
        encodeURIComponent(city) + "&count=1&language=en&format=json";
        
        //send the http request
        const locationResponse = await fetch(locationUrl);
        if (!locationResponse.ok) {
            throw new Error("City lookup failed.");
        }

        //read the responce from api and convert it to json
        const locationData = await locationResponse.json();

        //store the city object
        const location = locationData.results[0];

        //the end date sould be one day before current date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);

        //the start date will be the end date subtracted by the num of days they want
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - days);

        //get the max and min temp per day for the selected date range
        const pastWeatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=" + 
            location.latitude + "&longitude=" + location.longitude +
            "&daily=temperature_2m_max,temperature_2m_min&timezone=auto&start_date=" + formatDate(startDate) + 
            "&end_date=" + formatDate(endDate);

        //send the http request
        const pastWeatherResponse = await fetch(pastWeatherUrl);
        if (!pastWeatherResponse.ok) {
            throw new Error("Weather lookup failed.");
        }

        //read the responce from api and convert it to json
        const pastWeatherData = await pastWeatherResponse.json();

        // store the max/min temp
        const maxTemp = pastWeatherData.daily.temperature_2m_max;
        const minTemp = pastWeatherData.daily.temperature_2m_min;

        //store the times
        const dates = pastWeatherData.daily.time;

        //clear the graph
        clearGraph();

        //make the chart
        weatherChart = new Chart(graph, {
            type: "line",
            data: {
                labels: dates,
                datasets: [
                    {
                        label: `${location.name} - Daily High`,
                        data: maxTemp,
                        borderColor: "red",
                        backgroundColor: "red"
                    },
                    {
                        label: `${location.name} - Daily Low`,
                        data: minTemp,
                        borderColor: "blue",
                        backgroundColor: "blue"
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x:{
                        title: {
                            display: true,
                            text: "Date"
                        }
                    },
                    y:{
                        title: {
                            display: true,
                            text: "Temperature (°C)"
                        }
                    }
                }
            },

        });
        //update message to display the selected days
        chartStatusMessage.textContent = `Showing ${days} days of past weather: `;
    }catch (error){
        chartStatusMessage.textContent = error.message;
    }
}