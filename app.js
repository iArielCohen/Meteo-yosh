const API_KEY = 'd1cdbb26505d921a4dc5358f019a531a';

// נתוני מחוז יהודה (כפי שהוגדרו קודם, כשהם מקורבים)
const mainRegion = { name: 'יהודה', lat: 31.5326, lon: 35.0998 }; 

// שאר הערים - נשתמש בשמות באנגלית עבור ה-API
const otherCities = [
    { id: 'Jerusalem', nameHebrew: 'ירושלים' },
    { id: 'Tel Aviv', nameHebrew: 'תל אביב' },
    { id: 'Beersheba', nameHebrew: 'באר שבע' },
    { id: 'Haifa', nameHebrew: 'חיפה' },
    { id: 'Safed', nameHebrew: 'הגליל (צפת)' }
];

// הצגת תאריך ושעה מדויקת - מתעדכן חיה
function displayDateTime() {
    const now = new Date();
    
    // אפשרויות לתאריך
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('he-IL', dateOptions);
    
    // אפשרויות לשעה
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const timeString = now.toLocaleTimeString('he-IL', timeOptions);
    
    document.getElementById('date-display').innerText = `${dateString} | ${timeString}`;
}

// המרת מעלות כיוון רוח לטקסט בעברית
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

// חישוב סיכון שריפות לפי נתונים מטאורולוגיים
function calculateFireRisk(temp, humidity, windSpeedKmh) {
    if (temp > 32 && humidity < 25 && windSpeedKmh > 20) return { text: 'קיצוני', class: 'risk-extreme' };
    if (temp > 28 && humidity < 35 && windSpeedKmh > 15) return { text: 'גבוה', class: 'risk-high' };
    if (temp > 24 && humidity < 45) return { text: 'בינוני', class: 'risk-medium' };
    return { text: 'נמוך', class: 'risk-low' };
}

// המרת מהירות רוח מ-m/s ל-km/h
function msToKmh(ms) {
    return (ms * 3.6).toFixed(1);
}

// פונקציה להפעלת רקע דינמי מרובד
function setDynamicBackground(weatherCondition, isDay) {
    const bgLayer = document.getElementById('dynamic-bg');
    
    // ניקוי אפקטים קיימים
    bgLayer.classList.remove('day-bg', 'night-bg', 'show-sun', 'show-rain', 'show-clouds');
    
    // קביעת גרדיאנט בסיס יום/לילה
    if (isDay) {
        bgLayer.classList.add('day-bg');
    } else {
        bgLayer.classList.add('night-bg');
    }

    // הפעלת אפקטים ויזואליים עדינים לפי מזג האוויר
    switch (weatherCondition) {
        case 'Clear':
            bgLayer.classList.add('show-sun');
            break;
        case 'Clouds':
            bgLayer.classList.add('show-clouds');
            break;
        case 'Rain':
        case 'Drizzle':
            bgLayer.classList.add('show-rain');
            break;
        // אפשר להוסיף סופת רעמים או שלג אם רוצים, נסתפק באלה כרגע לאפקטים עדינים
    }
}

// משיכת נתונים עבור מחוז יהודה (הכרטיס הראשי)
async function fetchMainRegionData() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${mainRegion.lat}&lon=${mainRegion.lon}&appid=${API_KEY}&units=metric&lang=he`);
        const data = await response.json();
        
        const windSpeed = msToKmh(data.wind.speed);
        const humidity = data.main.humidity;
        const temp = data.main.temp;
        const windDir = getWindDirection(data.wind.deg);
        const fireRisk = calculateFireRisk(temp, humidity, windSpeed);
        
        // הפעלת הרקע הדינמי המעודכן
        const isDay = data.sys.sunrise < data.dt && data.dt < data.sys.sunset; // בדיקה אם יום
        setDynamicBackground(data.weather[0].main, isDay);

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

// משיכת נתונים עבור שאר האזורים (הכרטיסים התחתונים)
async function fetchOtherCitiesData() {
    const container = document.getElementById('other-cities');
    container.innerHTML = ''; // ניקוי הקיים

    for (const city of otherCities) {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city.id},IL&appid=${API_KEY}&units=metric&lang=he`);
            const data = await response.json();
            
            const temp = Math.round(data.main.temp);
            const desc = data.weather[0].description;
            
            const cardHtml = `
                <div class="city-card card">
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

// הפעלת פונקציות בעת טעינת העמוד
window.onload = () => {
    // הפעלה ראשונית של שעון ותאריך, ועדכון כל שנייה
    displayDateTime();
    setInterval(displayDateTime, 1000);
    
    // משיכת נתונים ראשונית
    fetchMainRegionData();
    fetchOtherCitiesData();
    
    // רענון הנתונים כל 30 דקות
    setInterval(() => {
        fetchMainRegionData();
        fetchOtherCitiesData();
    }, 30 * 60 * 1000);
};
