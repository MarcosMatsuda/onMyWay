# onMyWay Postman Collection

API testing collection for onMyWay backend with pre-configured environments, automatic token management, and full endpoint coverage.

## Quick Start

### 1. Import Collection & Environment

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `onMyWay.postman_collection.json`
4. Repeat for `onMyWay.postman_environment.json`

### 2. Select Environment

Click the environment dropdown (top-right) → Select **Local** or **Staging**

### 3. Run Auth Flow

1. **POST /auth/register** - Create test account
2. **POST /auth/login** - Get JWT token (saved automatically to `authToken`)
3. **GET /auth/profile** - Verify authentication

### 4. Test API Endpoints

All endpoints are organized by folder:

- **Auth** - Account & authentication
- **Locations** - Location tracking
- **Schools** - School arrivals & stats

## Environments

### Local
```
baseUrl: http://localhost:3000
authToken: (auto-populated)
schoolId: (set after listing schools)
parentId: (set after auth)
```

### Staging
```
baseUrl: https://api.staging.onmyway.dev
authToken: (auto-populated)
schoolId: (set after listing schools)
parentId: (set after auth)
```

## Variables

- `baseUrl` - API base URL (changes per environment)
- `authToken` - JWT bearer token (auto-saved after login)
- `schoolId` - School UUID (set manually or from response)
- `parentId` - Parent/User UUID (extracted from login response)

## Auto-Token Management

**POST /auth/login** has a test script that automatically:
1. Extracts JWT from response
2. Saves to `authToken` environment variable
3. All subsequent authenticated requests use this token

No manual copy-paste needed!

## Making Requests

### Unauthenticated

Use as-is:
- POST /auth/register
- POST /auth/login

### Authenticated

Pre-request script automatically attaches:
```
Authorization: Bearer {{authToken}}
```

No manual header entry required.

## WebSocket Notes

Postman does not support Socket.io natively. For WebSocket testing:

### Option 1: wscat (CLI)
```bash
npm install -g wscat
wscat -c http://localhost:3000/socket.io/?transport=websocket
```

### Option 2: Swagger UI
Visit `http://localhost:3000/api/docs` → Test WebSocket subscriptions

### Option 3: Browser Console
```javascript
const io = new ioClient('http://localhost:3000');
io.on('connect', () => console.log('Connected'));
io.on('arrivalsUpdated', (data) => console.log(data));
```

## Example Flow

### Complete End-to-End Test

1. **POST /auth/register**
   ```json
   {
     "name": "Test Parent",
     "email": "test@example.com",
     "password": "SecurePass123",
     "schoolId": "550e8400-e29b-41d4-a716-446655440000"
   }
   ```

2. **POST /auth/login** (auto-saves token)
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass123"
   }
   ```

3. **POST /locations** (with auth)
   ```json
   {
     "lat": 23.5505,
     "lng": -46.6333,
     "accuracy": 10
   }
   ```

4. **GET /locations/me** (with auth)
   - Returns latest location + ETA

5. **GET /schools/{{schoolId}}/arrivals** (with auth)
   - Returns parents within geofence

## Troubleshooting

### "Unauthorized" Error
- Check `authToken` is populated in environment
- Re-run POST /auth/login
- Verify token is not expired

### "Invalid School ID"
- Set `schoolId` variable after getting list of schools
- Or extract from a response

### Tests Not Running
- Verify Tests tab is visible in Postman
- Request must have a Tests script (included in collection)

## Rate Limiting

API enforces rate limiting:
- **Global:** 100 requests/min per IP
- **Auth endpoints:** 10 requests/min per IP

Tests respect these limits. Space requests appropriately for production testing.

## Support

For issues or feature requests related to the API, open a GitHub issue:
https://github.com/MarcosMatsuda/onMyWay/issues
