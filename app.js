const API_KEY = 'd1cdbb26505d921a4dc5358f019a531a';

const mainRegion = { name: 'יהודה', lat: 31.5326, lon: 35.0998 }; 

const otherCities = [
    { id: 'Jerusalem', nameHebrew: 'ירושלים' },
    { id: 'Tel Aviv', nameHebrew: 'תל אביב' },
    { id: 'Beersheba', nameHebrew: 'באר שבע' },
    { id: 'Haifa', nameHebrew: 'חיפה' },
    { id: 'Safed', nameHebrew: 'הגליל (צפת)' }
];

// הצגת תאריך ושעה מדויקת - מופיע במסך הראשי
function displayDateTime() {
    const now = new Date();
    
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('he-IL', dateOptions);
    
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const timeString = now.toLocaleTimeString('he-IL', timeOptions);
    
    document.getElementById('date-display').innerText = `${dateString} | ${timeString}`;
}

function getWindDirection(degree) {
    if (degree >= 337.5 || degree < 22.5) return 'צפונית';
    if (degree >= 22.5 && degree < 67.5) return 'צפונית-מזרחית';
    if (degree >= 67.5 && degree < 112.5) return 'מזרחית';
    if (degree >= 112.5 && degree < 157.5) return 'דרומית-מזרחית';
    if (degree >= 157.5 && degree < 202.5) return 'דרומית';
    if (degree >= 202.5 && degree < 247.5) return 'דרומית-מערבית';
    if (degree >= 247.5 && degree < 292.5) return 'מערבית';
    if (degree >= 292.5 && degree < 337.5) return 'צפונית-מערבית';
    return '-';
}

function calculateFireRisk(temp, humidity, windSpeedKmh) {
    if (temp > 32 && humidity < 25 && windSpeedKmh > 20) return { text: 'קיצוני', class: 'risk-extreme' };
    if (temp > 28 && humidity < 35 && windSpeedKmh > 15) return { text: 'גבוה', class: 'risk-high' };
    if (temp > 24 && humidity < 45) return { text: 'בינוני', class: 'risk-medium' };
    return { text: 'נמוך', class: 'risk-low' };
}

function msToKmh(ms) {
    return (ms * 3.6).toFixed(1);
}

function setDynamicBackground(weatherCondition) {
    const body = document.body;
    body.className = ''; 
    
    switch (weatherCondition) {
        case 'Clear': body.classList.add('bg-clear'); break;
        case 'Clouds': body.classList.add('bg-clouds'); break;
        case 'Rain':
        case 'Drizzle': body.classList.add('bg-rain'); break;
        case 'Thunderstorm': body.classList.add('bg-thunderstorm'); break;
        case 'Snow': body.classList.add('bg-snow'); break;
        default: body.classList.add('bg-default');
    }
}

async function fetchMainRegionData() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${mainRegion.lat}&lon=${mainRegion.lon}&appid=${API_KEY}&units=metric&lang=he`);
        const data = await response.json();
        
        const windSpeed = msToKmh(data.wind.speed);
        const humidity = data.main.humidity;
        const temp = data.main.temp;
        const windDir = getWindDirection(data.wind.deg);
        const fireRisk = calculateFireRisk(temp, humidity, windSpeed);
        
        setDynamicBackground(data.weather[0].main);

        document.getElementById('judea-wind').innerText = `${windSpeed} קמ"ש`;
        document.getElementById('judea-humidity').innerText = `${humidity}%`;
        document.getElementById('judea-wind-dir').innerText = windDir;
        
        const fireRiskEl = document.getElementById('judea-fire-risk');
        fireRiskEl.innerText = fireRisk.text;
        fireRiskEl.className = `metric-value fire-risk ${fireRisk.class}`;

    } catch (error) {
        console.error('Error fetching main region data:', error);
    }
}

async function fetchOtherCitiesData() {
    const container = document.getElementById('other-cities');
    container.innerHTML = ''; 

    for (const city of otherCities) {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city.id},IL&appid=${API_KEY}&units=metric&lang=he`);
            const data = await response.json();
            
            const temp = Math.round(data.main.temp);
            const desc = data.weather[0].description;
            
            const cardHtml = `
                <div class="city-card">
                    <div class="city-name">${city.nameHebrew}</div>
                    <div class="city-temp">${temp}°C</div>
                    <div class="city-details">${desc}</div>
                </div>
            `;
            container.innerHTML += cardHtml;
        } catch (error) {
            console.error(`Error fetching data for ${city.nameHebrew}:`, error);
        }
    }
}

// === מערכת לפיד בזמן אמת (WebSocket) ===

// את הכתובת הזו תצטרך להחליף בכתובת האמיתית שתקבל מאגף תקשוב
const LAPID_WS_URL = 'wss://your-internal-server.fire.gov.il/alerts'; 
let lapidSocket;

function connectToLapidRealTime() {
    try {
        lapidSocket = new WebSocket(LAPID_WS_URL);

        // כשהחיבור נפתח בהצלחה
        lapidSocket.onopen = () => {
            console.log('מחובר למערכת לפיד בהצלחה. מאזין לאירועים...');
        };

        // ברגע שמתקבל אירוע חדש בזמן אמת
        lapidSocket.onmessage = (event) => {
            // השרת לרוב שולח את המידע כאובייקט JSON, אנחנו ממירים אותו כדי שנוכל לקרוא אותו
            const eventData = JSON.parse(event.data);
            
            // מניחים שהשדה שמכיל את תיאור האירוע נקרא 'description', יש לוודא זאת מול מחלקת ה-IT
            const alertMessage = eventData.description || "אירוע חדש התקבל במערכת.";
            
            showLapidAlert(alertMessage);
        };

        // במקרה של ניתוק מהשרת (למשל נפילת רשת)
        lapidSocket.onclose = () => {
            console.log('החיבור למערכת לפיד נותק. מנסה להתחבר מחדש בעוד 5 שניות...');
            setTimeout(connectToLapidRealTime, 5000); // ניסיון התחברות מחדש אוטומטי
        };

        // במקרה של שגיאה
        lapidSocket.onerror = (error) => {
            console.error('שגיאת חיבור ל-WebSocket:', error);
        };
    } catch (e) {
        console.error('שגיאה בהקמת חיבור:', e);
    }
}

function showLapidAlert(eventText) {
    const modal = document.getElementById('lapid-modal');
    const details = document.getElementById('lapid-event-details');
    
    details.innerText = eventText;
    modal.classList.add('active');
}

function closeLapidAlert() {
    const modal = document.getElementById('lapid-modal');
    modal.classList.remove('active');
}

// הפעלת פונקציות בעת טעינת העמוד
window.onload = () => {
    // שעון שמתעדכן כל שנייה
    displayDateTime();
    setInterval(displayDateTime, 1000);
    
    // משיכת נתוני מזג אוויר ורענון כל חצי שעה
    fetchMainRegionData();
    fetchOtherCitiesData();
    setInterval(() => {
        fetchMainRegionData();
        fetchOtherCitiesData();
    }, 30 * 60 * 1000);

    // התחברות לערוץ התקשורת החי של מערכת לפיד
    // connectToLapidRealTime(); // מוסתר בהערה עד שתזין את הכתובת האמיתית כדי למנוע שגיאות בדפדפן
};
