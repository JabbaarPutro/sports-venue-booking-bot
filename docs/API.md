# 📚 API Documentation

Dokumentasi lengkap untuk semua API dan integrasi yang digunakan dalam Sports Venue Booking Bot.

## 📑 Daftar Isi

- [Internal Architecture](#internal-architecture)
- [Google Places API](#google-places-api)
- [OLLAMA AI API](#ollama-ai-api)
- [Telegram Bot API](#telegram-bot-api)
- [Database Queries](#database-queries)

---

## Internal Architecture

### Core Components

```
src/
├── bot/               # Telegram bot handlers
├── ai/                # OLLAMA AI integration
├── api/               # External API integrations
├── services/          # Business logic services
├── notifications/     # Email & Telegram notifications
├── database/          # Database models and connection
└── utils/             # Utility functions
```

### Service Dependencies

```
TelegramBot → MessageHandler → IntentExtractor → OllamaClient
                            ↓
                        VenueSearch → GooglePlacesAPI
                            ↓
                    AlternativeSearch → VenueChecker
                            ↓
                  RecommendationEngine
                            ↓
                     BookingService
                            ↓
                EmailNotification + TelegramNotification
```

---

## Google Places API

### Places Text Search

**Endpoint**: `https://maps.googleapis.com/maps/api/place/textsearch/json`

**Method**: GET

**Parameters**:
- `query` (required): Search query (e.g., "futsal jakarta selatan")
- `key` (required): Your Google Places API key
- `language` (optional): Response language (default: "id")

**Example Request**:
```javascript
const response = await axios.get(
  'https://maps.googleapis.com/maps/api/place/textsearch/json',
  {
    params: {
      query: 'futsal jakarta selatan',
      key: 'YOUR_API_KEY',
      language: 'id'
    }
  }
);
```

**Example Response**:
```json
{
  "results": [
    {
      "place_id": "ChIJ...",
      "name": "Futsal Arena Jakarta",
      "formatted_address": "Jl. Sudirman No. 123, Jakarta Selatan",
      "rating": 4.5,
      "user_ratings_total": 234,
      "geometry": {
        "location": {
          "lat": -6.2297,
          "lng": 106.8161
        }
      },
      "photos": [
        {
          "photo_reference": "CnRt...",
          "height": 1080,
          "width": 1920
        }
      ]
    }
  ],
  "status": "OK"
}
```

### Place Details

**Endpoint**: `https://maps.googleapis.com/maps/api/place/details/json`

**Method**: GET

**Parameters**:
- `place_id` (required): Place ID from search results
- `fields` (required): Comma-separated list of fields
- `key` (required): Your Google Places API key
- `language` (optional): Response language (default: "id")

**Available Fields**:
- `name`, `formatted_address`, `formatted_phone_number`
- `rating`, `reviews`, `user_ratings_total`
- `photos`, `opening_hours`, `geometry`
- `price_level`, `website`

**Example Request**:
```javascript
const response = await axios.get(
  'https://maps.googleapis.com/maps/api/place/details/json',
  {
    params: {
      place_id: 'ChIJ...',
      fields: 'name,formatted_address,rating,reviews,photos',
      key: 'YOUR_API_KEY',
      language: 'id'
    }
  }
);
```

### Place Photo

**Endpoint**: `https://maps.googleapis.com/maps/api/place/photo`

**Method**: GET

**Parameters**:
- `maxwidth` (required): Maximum width in pixels (max 1600)
- `photo_reference` (required): Photo reference from place details
- `key` (required): Your Google Places API key

**Example URL**:
```
https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=CnRt...&key=YOUR_API_KEY
```

### API Usage in Code

```javascript
// src/api/googlePlaces.js
class GooglePlacesAPI {
  async searchVenues(sport, location) {
    const query = `${sport} ${location}`;
    const response = await axios.get(
      `${this.baseUrl}/place/textsearch/json`,
      {
        params: {
          query: query,
          key: this.apiKey,
          language: 'id'
        }
      }
    );
    return response.data.results || [];
  }

  async getPlaceDetails(placeId) {
    const response = await axios.get(
      `${this.baseUrl}/place/details/json`,
      {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,rating,reviews,photos,opening_hours',
          key: this.apiKey,
          language: 'id'
        }
      }
    );
    return response.data.result;
  }
}
```

---

## OLLAMA AI API

### Generate Completion

**Endpoint**: `http://localhost:11434/api/generate`

**Method**: POST

**Request Body**:
```json
{
  "model": "llama2",
  "prompt": "Extract booking info from: 'Cari lapangan futsal di Jakarta besok jam 18:00'",
  "stream": false,
  "options": {
    "temperature": 0.7
  }
}
```

**Response**:
```json
{
  "model": "llama2",
  "response": "{\"sport\":\"Futsal\",\"location\":\"Jakarta\",\"date\":\"2025-11-20\",\"time\":\"18:00\"}",
  "done": true
}
```

### Chat Completion

**Endpoint**: `http://localhost:11434/api/chat`

**Method**: POST

**Request Body**:
```json
{
  "model": "llama2",
  "messages": [
    {
      "role": "user",
      "content": "Extract sport, location, date, time from: 'Booking tennis Bandung minggu depan'"
    }
  ],
  "stream": false
}
```

### Check Model Availability

**Endpoint**: `http://localhost:11434/api/tags`

**Method**: GET

**Response**:
```json
{
  "models": [
    {
      "name": "llama2:latest",
      "size": 3825819519
    }
  ]
}
```

### API Usage in Code

```javascript
// src/ai/ollamaClient.js
class OllamaClient {
  async extractJSON(prompt) {
    const response = await axios.post(
      `${this.baseUrl}/api/generate`,
      {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: { temperature: 0.3 }
      }
    );
    
    const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  }
}
```

### Intent Extraction

```javascript
// src/ai/intentExtractor.js
async extractIntent(message) {
  const prompt = `
Extract booking information from this Indonesian text: "${message}"

Extract these fields and return as JSON:
- sport: type of sport or null
- location: city or area name or null
- date: date in YYYY-MM-DD format or null
- time: time in HH:mm format or null

Return only valid JSON without explanation.
`;

  const result = await this.ollama.extractJSON(prompt);
  return this.validateAndEnrichIntent(result);
}
```

---

## Telegram Bot API

### Bot Methods (via Telegraf)

#### Send Message

```javascript
await ctx.reply('Hello World!', {
  parse_mode: 'Markdown'
});
```

#### Send Photo

```javascript
await ctx.replyWithPhoto(photoUrl, {
  caption: 'Venue Photo',
  parse_mode: 'Markdown'
});
```

#### Send Message with Inline Keyboard

```javascript
await ctx.reply('Choose venue:', {
  parse_mode: 'Markdown',
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'Venue A', callback_data: 'select_venue_A' },
        { text: 'Venue B', callback_data: 'select_venue_B' }
      ]
    ]
  }
});
```

#### Edit Message

```javascript
await ctx.telegram.editMessageText(
  chatId,
  messageId,
  null,
  'Updated message text'
);
```

#### Delete Message

```javascript
await ctx.telegram.deleteMessage(chatId, messageId);
```

### Callback Query Handling

```javascript
// Handle button clicks
bot.action(/select_venue_(.+)/, async (ctx) => {
  const venueId = ctx.match[1];
  await ctx.answerCbQuery('Loading venue...');
  // Process venue selection
});
```

### Command Handling

```javascript
bot.command('start', async (ctx) => {
  await ctx.reply('Welcome!');
});

bot.command('help', async (ctx) => {
  await ctx.reply('Help text...');
});
```

---

## Database Queries

### User Operations

#### Find User by Telegram ID

```javascript
// src/database/models/User.js
static async findByTelegramId(telegramId) {
  const sql = 'SELECT * FROM users WHERE telegram_id = ?';
  const results = await query(sql, [telegramId]);
  return results[0] || null;
}
```

#### Create User

```javascript
static async create(telegramId, username, email = null) {
  const sql = `
    INSERT INTO users (telegram_id, username, email) 
    VALUES (?, ?, ?) 
    ON DUPLICATE KEY UPDATE username = ?, email = ?
  `;
  const result = await query(sql, [
    telegramId, username, email, username, email
  ]);
  return result.insertId;
}
```

### Booking Operations

#### Create Booking

```javascript
// src/database/models/Booking.js
static async create(bookingData) {
  const sql = `
    INSERT INTO bookings 
    (user_id, venue_place_id, venue_name, venue_address, venue_phone, 
     sport_type, booking_date, booking_time, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    bookingData.user_id,
    bookingData.venue_place_id,
    bookingData.venue_name,
    bookingData.venue_address,
    bookingData.venue_phone,
    bookingData.sport_type,
    bookingData.booking_date,
    bookingData.booking_time,
    bookingData.status,
    bookingData.notes
  ]);
  return result.insertId;
}
```

#### Get User Bookings

```javascript
static async findByUserId(userId) {
  const sql = `
    SELECT * FROM bookings 
    WHERE user_id = ? 
    ORDER BY booking_date DESC, booking_time DESC
  `;
  return await query(sql, [userId]);
}
```

#### Get Upcoming Bookings for Reminder

```javascript
static async getUpcomingBookingsForReminder(hours) {
  const sql = `
    SELECT b.*, u.telegram_id, u.email, u.username
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE b.status = 'confirmed'
    AND CONCAT(b.booking_date, ' ', b.booking_time) 
        BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? HOUR)
    AND (
      (? = 24 AND b.reminder_24h_sent = FALSE) OR
      (? = 3 AND b.reminder_3h_sent = FALSE)
    )
  `;
  return await query(sql, [hours, hours, hours]);
}
```

### Venue Operations

#### Cache Venue

```javascript
// src/database/models/Venue.js
static async create(venueData) {
  const sql = `
    INSERT INTO venues_cache 
    (place_id, name, address, rating, phone, latitude, longitude, 
     photo_reference, opening_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    rating = VALUES(rating),
    cached_at = CURRENT_TIMESTAMP
  `;
  const result = await query(sql, [
    venueData.place_id,
    venueData.name,
    venueData.address,
    venueData.rating,
    venueData.phone,
    venueData.latitude,
    venueData.longitude,
    venueData.photo_reference,
    JSON.stringify(venueData.opening_hours)
  ]);
  return result.insertId || result.affectedRows;
}
```

#### Search Cached Venues

```javascript
static async search(searchTerm) {
  const sql = `
    SELECT * FROM venues_cache 
    WHERE name LIKE ? OR address LIKE ?
    ORDER BY rating DESC
  `;
  const term = `%${searchTerm}%`;
  return await query(sql, [term, term]);
}
```

---

## Service APIs

### Venue Search Service

```javascript
// src/api/venueSearch.js
const venueSearch = new VenueSearch();

// Search venues
const venues = await venueSearch.search('Futsal', 'Jakarta Selatan', {
  limit: 5,
  minRating: 4.0
});

// Get venue details
const details = await venueSearch.getVenueDetails('ChIJ...');

// Search with alternatives
const allVenues = await venueSearch.searchWithAlternatives(
  'Tennis', 
  'Bandung',
  { maxAttempts: 3, limit: 5 }
);
```

### Venue Checker Service

```javascript
// src/services/venueChecker.js
const checker = new VenueChecker();

// Check multiple venues in parallel
const checkedVenues = await checker.checkMultipleVenues(
  venues,
  '2025-11-20',
  '18:00',
  async (venue, status, index) => {
    console.log(`Venue ${index}: ${status}`);
  }
);

// Get available venues
const available = checker.getAvailableVenues(checkedVenues);
```

### Recommendation Engine

```javascript
// src/services/recommendationEngine.js
const engine = new RecommendationEngine();

// Rank venues
const ranked = engine.rankVenues(venues, userLocation, preferences);

// Get top 3 recommendations
const top3 = engine.getTopRecommendations(venues, userLocation, 3);

// Calculate score for single venue
const score = engine.calculateScore(venue, userLocation);
```

### Booking Service

```javascript
// src/services/bookingService.js
const bookingService = new BookingService();

// Create booking
const booking = await bookingService.createBooking(
  telegramId,
  venueData,
  {
    sport: 'Futsal',
    date: '2025-11-20',
    time: '18:00',
    username: 'john_doe'
  }
);

// Confirm booking
await bookingService.confirmBooking(booking.id);

// Get venue preview
const preview = await bookingService.getVenuePreview('ChIJ...');
```

---

## Rate Limits & Quotas

### Google Places API

- **Free Tier**: $200 credit per month
- **Text Search**: $32 per 1000 requests
- **Place Details**: $17 per 1000 requests
- **Place Photos**: $7 per 1000 requests
- **Recommended**: ~6,000 requests per month free

### OLLAMA AI

- **Local**: No limits
- **Resource**: Depends on your machine (RAM, CPU)
- **Model Size**: llama2 = ~3.8GB

### Telegram Bot API

- **Message Rate**: 30 messages per second
- **Bot Rate**: 20 requests per second per bot
- **No Cost**: Completely free

---

## Error Handling

### Google Places API Errors

```javascript
try {
  const venues = await googlePlaces.searchVenues(sport, location);
} catch (error) {
  if (error.response?.data?.status === 'OVER_QUERY_LIMIT') {
    // Handle quota exceeded
  } else if (error.response?.data?.status === 'INVALID_REQUEST') {
    // Handle invalid request
  } else {
    // Handle other errors
  }
}
```

### Database Errors

```javascript
try {
  const booking = await Booking.create(bookingData);
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    // Handle duplicate entry
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    // Handle foreign key constraint
  } else {
    Logger.error('Database error:', error);
  }
}
```

---

**Next**: Baca [DATABASE.md](DATABASE.md) untuk schema database lengkap.
