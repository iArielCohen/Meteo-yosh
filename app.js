const apiKey = 'd1cdbb26505d921a4dc5358f019a531a'; // מפתח ה-API שלך
const city = 'Jerusalem,IL'; // שם העיר (לדוגמה ירושלים)
const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

// פונקציה שתשאב את הנתונים מה-API
async function getWeatherData() {
    try {
        const response = await fetch(apiUrl);

        // אם התשובה מה-API לא תקינה, נשלול אותה
        if (!response.ok) {
            throw new Error(`שגיאה בקבלת הנתונים, סטטוס: ${response.status}`);
        }

        const data = await response.json();
        
        // אם הנתונים לא תקינים, נסמן שגיאה
        if (!data || !data.wind || !data.main) {
            throw new Error('הנתונים לא הושגו כראוי');
        }

        // מוציאים את נתוני מהירות הרוח והלחות
        const windSpeed = data.wind.speed; // מהירות הרוח בקמ"ש
        const humidity = data.main.humidity; // רמת הלחות באחוזים
        const windDirection = data.wind.deg; // כיוון הרוח במעלות
        
        // עדכון המידע בממשק המשתמש
        document.getElementById('wind-speed').textContent = `${windSpeed} קמ"ש`;
        document.getElementById('humidity').textContent = `${humidity} %`;
        
        // חישוב כיוון הרוח
        const windDirectionText = getWindDirection(windDirection);
        document.getElementById('wind-direction').textContent = `כיוון הרוח: ${windDirectionText}`;

        // חישוב אינדקס הסיכון
        calculateFireRiskIndex(windSpeed, humidity);

        // הצגת תאריך ויום בשבוע
        displayDateAndDay();

        // עדכון מצב מזג האוויר
        updateWeatherIconAndBackground(data.weather[0].main);

    } catch (error) {
        console.error('Error fetching weather data:', error);
        document.getElementById('weather-info').innerHTML = `<p style='color:red;'>שגיאה בהבאת נתוני מזג האוויר: ${error.message}</p>`;
    }
}

// פונקציה להמיר כיוון רוח במעלות לטקסט (צפון, דרום, מזרח, מערב וכו')
function getWindDirection(degrees) {
    if (degrees >= 0 && degrees < 22.5) return "צפון";
    else if (degrees >= 22.5 && degrees < 67.5) return "צפון מזרח";
    else if (degrees >= 67.5 && degrees < 112.5) return "מזרח";
    else if (degrees >= 112.5 && degrees < 157.5) return "דרום מזרח";
    else if (degrees >= 157.5 && degrees < 202.5) return "דרום";
    else if (degrees >= 202.5 && degrees < 247.5) return "דרום מערב";
    else if (degrees >= 247.5 && degrees < 292.5) return "מערב";
    else if (degrees >= 292.5 && degrees < 337.5) return "צפון מערב";
    else return "צפון";
}

// פונקציה לעדכון אייקון ומצב הרקע על פי מזג האוויר
function updateWeatherIconAndBackground(weather) {
    const body = document.body;
    const weatherIcon = document.getElementById('weather-icon');

    // ברירת המחדל של הרקע היא שמיים כחולים
    body.classList.remove('sunny', 'cloudy', 'fire-risk-high');

    if (weather === 'Clear') {
        body.classList.add('sunny');
        weatherIcon.textContent = '☀️'; // אייקון של שמש
    } else if (weather === 'Clouds') {
        body.classList.add('cloudy');
        weatherIcon.textContent = '☁️'; // אייקון של עננים
    } else if (weather === 'Rain') {
        body.classList.add('cloudy');
        weatherIcon.textContent = '🌧️'; // אייקון של גשם
    }

    // אם יש סיכון גבוה לשריפות, נוסיף את הרקע של האש
    const fireRiskIndex = document.getElementById('index').classList.contains('high');
    if (fireRiskIndex) {
        body.classList.add('fire-risk-high');
        weatherIcon.textContent += ' 🔥'; // אייקון של אש
    }
}

// פונקציה לחישוב אינדקס הסיכון לשריפות
function calculateFireRiskIndex(windSpeed, humidity) {
    let fireRiskIndex;
    let indexText;
    let indexClass;

    // חישוב סיווג מהירות הרוח
    let windCategory;
    if (windSpeed > 30) {
        windCategory = 'חזקה מאוד'; // מעל 30 קמ"ש
    } else if (windSpeed >= 20) {
        windCategory = 'חזקה'; // 20-30 קמ"ש
    } else if (windSpeed >= 10) {
        windCategory = 'בינונית'; // 10-20 קמ"ש
    } else {
        windCategory = 'חלשה'; // עד 10 קמ"ש
    }

    // חישוב סיווג הלחות
    let humidityCategory;
    if (humidity > 30) {
        humidityCategory = 'קיצונית'; // מעל 30%
    } else if (humidity >= 20) {
        humidityCategory = 'גבוהה'; // מ-10% עד 20%
    } else if (humidity >= 10) {
        humidityCategory = 'בינונית'; // 10-20%
    } else {
        humidityCategory = 'נמוכה מאוד'; // עד 10%
    }

    // הגדרת אינדקס הסיכון לפי סיווג הרוח והלחות
    if (windCategory === 'חזקה מאוד' && humidityCategory === 'נמוכה מאוד') {
        indexText = 'סיכון גבוה לשריפות';
        indexClass = 'high';
    } else if (windCategory === 'חזקה' && humidityCategory === 'נמוכה מאוד') {
        indexText = 'סיכון גבוה לשריפות';
        indexClass = 'high';
    } else if (windCategory === 'בינונית' && humidityCategory === 'נמוכה') {
        indexText = 'סיכון בינוני לשריפות';
        indexClass = 'medium';
    } else if (windCategory === 'חלשה' && humidityCategory === 'נמוכה') {
        indexText = 'סיכון נמוך לשריפות';
        indexClass = 'low';
    } else {
        indexText = 'סיכון נמוך לשריפות';
        indexClass = 'low';
    }

    // עדכון רמת הסיכון בממשק המשתמש
    document.getElementById('fire-index-text').textContent = indexText;
    document.getElementById('index').className = indexClass;
}

// פונקציה להצגת תאריך והיום בשבוע
function displayDateAndDay() {
    const today = new Date();

    // קבלת היום בשבוע
    const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayOfWeek = daysOfWeek[today.getDay()];

    // קבלת התאריך
    const date = today.toLocaleDateString('he-IL'); // תאריך בפורמט ישראלי

    // עדכון התאריך והיום בשבוע בממשק המשתמש
    document.getElementById('current-day').textContent = `יום: ${dayOfWeek}`;
    document.getElementById('current-date').textContent = `תאריך: ${date}`;
}

getWeatherData();
