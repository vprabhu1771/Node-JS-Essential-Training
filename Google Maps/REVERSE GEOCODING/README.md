`ride.js`

```
const axios = require('axios');
require('dotenv').config();

// Reverse geocoding function
async function reverseGeocode(lat, lon) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return 'No API key available';
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      // Return the formatted address from the first result
      return response.data.results[0].formatted_address;
    } else {
      return `Address not found (${response.data.status})`;
    }
  } catch (e) {
    return `Geocoding failed: ${e.message}`;
  }
}

async function getRouteWithTolls(lat1, lon1, lat2, lon2) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.log('No Google Maps API key found.');
    return;
  }

  console.log('=== REVERSE GEOCODING ===');
  console.log('Getting addresses...');
  
  // Get addresses for pickup and drop
  const [pickupAddress, dropAddress] = await Promise.all([
    reverseGeocode(lat1, lon1),
    reverseGeocode(lat2, lon2)
  ]);

  console.log(`Pickup Address: ${pickupAddress}`);
  console.log(`Drop Address: ${dropAddress}`);
  console.log('========================\n');

  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: lat1,
          longitude: lon1
        }
      }
    },
    destination: {
      location: {
        latLng: {
          latitude: lat2,
          longitude: lon2
        }
      }
    },
    travelMode: 'DRIVE',
    extraComputations: ['TOLLS'],
    routeModifiers: {
      vehicleInfo: {
        emissionType: 'GASOLINE',
      },
    },
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo,routes.distanceMeters,routes.duration,routes.legs.distanceMeters,routes.legs.duration,routes.legs.startLocation,routes.legs.endLocation',
      },
    });

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      
      // LOG THE FULL ROUTE DATA
      console.log('=== FULL ROUTE DATA ===');
      console.log(JSON.stringify(route, null, 2));
      console.log('=== END ROUTE DATA ===\n');

      // Distance and Duration
      console.log(`Distance: ${(route.distanceMeters / 1000).toFixed(2)} km`);
      console.log(`Duration: ${Math.ceil(route.duration / 60)} minutes\n`);

      // 1. Total toll for the whole route
      const totalRouteToll = route.travelAdvisory?.tollInfo?.estimatedPrice;
      
      if (totalRouteToll && totalRouteToll.length > 0) {
        console.log('=== TOTAL TOLL FOR ROUTE ===');
        totalRouteToll.forEach((price, index) => {
          const amount = price.units + '.' + String(price.nanos).padStart(9, '0');
          console.log(`Total Toll ${index + 1}: ${price.currencyCode} ${amount}`);
        });
        console.log('');
      } else {
        console.log('No total toll information available.\n');
      }

      // 2. Tolls for each leg
      console.log('=== PER-LEG TOLL BREAKDOWN ===');
      if (route.legs && route.legs.length > 0) {
        route.legs.forEach((leg, index) => {
          console.log(`\nLeg ${index + 1}:`);
          console.log(`  Distance: ${(leg.distanceMeters / 1000).toFixed(2)} km`);
          console.log(`  Duration: ${Math.ceil(leg.duration / 60)} minutes`);
          
          // Show start and end locations for the leg
          if (leg.startLocation) {
            console.log(`  Start: ${leg.startLocation.latLng.latitude}, ${leg.startLocation.latLng.longitude}`);
          }
          if (leg.endLocation) {
            console.log(`  End: ${leg.endLocation.latLng.latitude}, ${leg.endLocation.latLng.longitude}`);
          }
          
          const legTollInfo = leg.travelAdvisory?.tollInfo?.estimatedPrice;
          if (legTollInfo && legTollInfo.length > 0) {
            legTollInfo.forEach((price) => {
              const amount = price.units + '.' + String(price.nanos).padStart(9, '0');
              console.log(`  Toll: ${price.currencyCode} ${amount}`);
            });
          } else {
            console.log('  No tolls on this leg');
          }
        });
      } else {
        console.log('No leg information available.');
      }

      // Calculate sum of individual leg tolls
      let totalFromLegs = 0;
      if (route.legs) {
        route.legs.forEach((leg) => {
          const legTollInfo = leg.travelAdvisory?.tollInfo?.estimatedPrice;
          if (legTollInfo && legTollInfo.length > 0) {
            legTollInfo.forEach((price) => {
              if (price.currencyCode === 'INR') {
                totalFromLegs += price.units + (price.nanos / 1000000000);
              }
            });
          }
        });
      }

      // Show comparison
      console.log('\n=== TOLL SUMMARY ===');
      if (totalRouteToll && totalRouteToll.length > 0) {
        totalRouteToll.forEach((price) => {
          if (price.currencyCode === 'INR') {
            const routeTotal = price.units + (price.nanos / 1000000000);
            console.log(`Total from route-level: ₹${routeTotal.toFixed(2)}`);
            console.log(`Sum of individual legs: ₹${totalFromLegs.toFixed(2)}`);
            if (Math.abs(routeTotal - totalFromLegs) > 0.01) {
              console.log(`⚠️  MISMATCH: Difference of ₹${Math.abs(routeTotal - totalFromLegs).toFixed(2)}`);
              console.log('This could be due to:');
              console.log('  - Different toll routes being aggregated');
              console.log('  - Multiple currencies (unlikely for domestic)');
              console.log('  - API inconsistency');
            } else {
              console.log('✅ Totals match!');
            }
          }
        });
      }

      console.log('\n=== TRIP SUMMARY ===');
      console.log(`From: ${pickupAddress}`);
      console.log(`To: ${dropAddress}`);
      console.log(`Distance: ${(route.distanceMeters / 1000).toFixed(2)} km`);
      console.log(`Duration: ${Math.ceil(route.duration / 60)} minutes`);
      if (totalRouteToll && totalRouteToll.length > 0) {
        totalRouteToll.forEach((price) => {
          if (price.currencyCode === 'INR') {
            const routeTotal = price.units + (price.nanos / 1000000000);
            console.log(`Total Toll: ₹${routeTotal.toFixed(2)}`);
          }
        });
      }
      console.log('===================');

      return response.data;
    } else {
      console.log('No route found.');
    }
  } catch (e) {
    console.log('Routes API request failed:', e.message);
    if (e.response) {
      console.log('Error response:', JSON.stringify(e.response.data, null, 2));
    }
  }
}

// Alternative: Get just the address without running the full route
async function getAddressesOnly(lat1, lon1, lat2, lon2) {
  console.log('=== REVERSE GEOCODING ===');
  
  const [pickupAddress, dropAddress] = await Promise.all([
    reverseGeocode(lat1, lon1),
    reverseGeocode(lat2, lon2)
  ]);

  console.log(`\nPickup Location:`);
  console.log(`  Coordinates: (${lat1}, ${lon1})`);
  console.log(`  Address: ${pickupAddress}`);
  console.log(`\nDrop Location:`);
  console.log(`  Coordinates: (${lat2}, ${lon2})`);
  console.log(`  Address: ${dropAddress}`);
  console.log('========================');
  
  return { pickupAddress, dropAddress };
}

// Test with your coordinates
const pickupLat = 11.7498261;
const pickupLon = 79.7499146;
const dropLat = 12.982837;
const dropLon = 80.1683282;

console.log('=== ROUTE REQUEST ===');
console.log(`Pickup Coordinates: (${pickupLat}, ${pickupLon})`);
console.log(`Drop Coordinates: (${dropLat}, ${dropLon})`);
console.log('=====================\n');

// Option 1: Run the full route with tolls and addresses
getRouteWithTolls(pickupLat, pickupLon, dropLat, dropLon);

// Option 2: If you just want to get the addresses without the route
// getAddressesOnly(pickupLat, pickupLon, dropLat, dropLon);
```
