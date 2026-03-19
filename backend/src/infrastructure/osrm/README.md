# OSRM Service Integration

## Overview
The OSRM (Open Source Routing Machine) service provides route calculation and ETA functionality for the onMyWay application.

## Configuration

### Environment Variables
- `OSRM_BASE_URL`: Base URL for OSRM API (default: `http://router.project-osrm.org`)
- `OSRM_TIMEOUT_MS`: Request timeout in milliseconds (default: `10000`)

### Example `.env` configuration
```bash
# OSRM (MVP: public server, Production: self-hosted)
OSRM_BASE_URL=http://router.project-osrm.org
OSRM_TIMEOUT_MS=10000
```

## Usage

### Importing the Module
The `OSRMModule` is registered globally, so the `OSRMService` is available throughout the application.

```typescript
import { Injectable } from '@nestjs/common';
import { OSRMService } from './infrastructure/osrm/osrm.service';

@Injectable()
export class RouteService {
  constructor(private readonly osrmService: OSRMService) {}

  async calculateRoute() {
    // Use the service
  }
}
```

### Calculating a Route
```typescript
const result = await this.osrmService.calculateRoute(
  -23.55052, // fromLat
  -46.633308, // fromLng
  -23.561399, // toLat
  -46.655539, // toLng
);

console.log(result);
// Output:
// {
//   distanceMeters: 3251,
//   durationSeconds: 720,
//   polyline: 'w{s~F|`bvOqDqC_A?c@...'
// }
```

### Error Handling
The service throws `OSRMUnavailableError` when:
- OSRM API returns an error code (e.g., "NoRoute")
- Network timeout occurs
- HTTP error response (4xx, 5xx)
- Network connectivity issues

```typescript
import { OSRMUnavailableError } from './infrastructure/osrm/osrm-unavailable.error';

try {
  const result = await this.osrmService.calculateRoute(fromLat, fromLng, toLat, toLng);
} catch (error) {
  if (error instanceof OSRMUnavailableError) {
    // Handle routing service unavailability
    console.error('Routing service unavailable:', error.message);
  }
  throw error;
}
```

### Health Check
```typescript
const isHealthy = await this.osrmService.healthCheck();
if (!isHealthy) {
  console.warn('OSRM service is unhealthy');
}
```

## Types

### OSRMRouteResult
```typescript
interface OSRMRouteResult {
  distanceMeters: number;  // Distance in meters (rounded)
  durationSeconds: number; // Duration in seconds (rounded)
  polyline: string;        // Encoded polyline string
}
```

### OSRMRouteRequest
```typescript
interface OSRMRouteRequest {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}
```

## Testing

### Unit Tests
Run the OSRM service tests:
```bash
npm test -- osrm.service.spec.ts
```

### Integration Tests
For integration tests that actually call the OSRM API, you'll need to:
1. Set `OSRM_BASE_URL` to a test server or mock server
2. Handle network dependencies appropriately

## Production Considerations

### Self-Hosting OSRM
For production, consider self-hosting OSRM:
1. Better performance and reliability
2. No rate limiting
3. Custom routing profiles
4. Offline capability

### Error Rate Monitoring
Monitor OSRM API error rates and implement:
- Circuit breakers
- Fallback routing providers
- Graceful degradation

### Caching
Consider caching frequent routes to:
- Reduce API calls
- Improve response times
- Handle temporary OSRM unavailability