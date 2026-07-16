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
      return response.data.results[0].formatted_address;
    } else {
      return `Address not found (${response.data.status})`;
    }
  } catch (e) {
    return `Geocoding failed: ${e.message}`;
  }
}

// Helper function to parse toll amount
function parseTollAmount(price) {
  if (!price) return 0;
  
  try {
    if (price.units !== undefined) {
      const units = typeof price.units === 'string' ? parseFloat(price.units) : price.units;
      if (price.nanos !== undefined) {
        const nanos = typeof price.nanos === 'string' ? parseFloat(price.nanos) : price.nanos;
        return units + (nanos / 1000000000);
      } else {
        return units;
      }
    } else if (price.value !== undefined) {
      return typeof price.value === 'string' ? parseFloat(price.value) : price.value;
    } else if (typeof price === 'number' || typeof price === 'string') {
      return parseFloat(price);
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

// Get route with tolls (regular route)
async function getRouteWithTolls(lat1, lon1, lat2, lon2) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
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
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo',
      },
    });

    if (response.data?.routes?.length > 0) {
      const route = response.data.routes[0];
      const totalToll = route.travelAdvisory?.tollInfo?.estimatedPrice;
      
      // Parse toll amount
      let tollAmount = 0;
      if (totalToll && totalToll.length > 0) {
        tollAmount = parseTollAmount(totalToll[0]);
      }

      return {
        type: 'With Tolls (Default)',
        distance: route.distanceMeters / 1000,
        duration: Math.ceil(parseFloat(route.duration) / 60),
        totalToll: tollAmount,
        tollCount: totalToll?.length || 0,
        tollDetails: totalToll || []
      };
    }
    return null;
  } catch (e) {
    console.error('Error getting route with tolls:', e.message);
    return null;
  }
}

// Get route without tolls (shortest)
async function getRouteWithoutTolls(lat1, lon1, lat2, lon2) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
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
    routeModifiers: {
      avoidTolls: true,  // This avoids tolls
    },
    extraComputations: ['TOLLS'], // Still request toll info to confirm
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo',
      },
    });

    if (response.data?.routes?.length > 0) {
      const route = response.data.routes[0];
      const totalToll = route.travelAdvisory?.tollInfo?.estimatedPrice;
      
      // Check if there are any tolls
      let tollAmount = 0;
      if (totalToll && totalToll.length > 0) {
        tollAmount = parseTollAmount(totalToll[0]);
      }

      return {
        type: 'No Tolls (Avoid Tolls)',
        distance: route.distanceMeters / 1000,
        duration: Math.ceil(parseFloat(route.duration) / 60),
        totalToll: tollAmount,
        tollCount: totalToll?.length || 0,
        tollDetails: totalToll || []
      };
    }
    return null;
  } catch (e) {
    console.error('Error getting route without tolls:', e.message);
    return null;
  }
}

// Get multiple route options
async function getRouteAlternatives(lat1, lon1, lat2, lon2) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
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
    computeAlternativeRoutes: true,  // Get alternative routes
    extraComputations: ['TOLLS'],
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo',
      },
    });

    if (response.data?.routes?.length > 0) {
      return response.data.routes.map((route, index) => {
        const totalToll = route.travelAdvisory?.tollInfo?.estimatedPrice;
        let tollAmount = 0;
        if (totalToll && totalToll.length > 0) {
          tollAmount = parseTollAmount(totalToll[0]);
        }

        return {
          routeNumber: index + 1,
          distance: route.distanceMeters / 1000,
          duration: Math.ceil(parseFloat(route.duration) / 60),
          totalToll: tollAmount,
          tollCount: totalToll?.length || 0,
          tollDetails: totalToll || []
        };
      });
    }
    return [];
  } catch (e) {
    console.error('Error getting alternative routes:', e.message);
    return [];
  }
}

// Main function
async function main() {
  const pickupLat = 11.7498261;
  const pickupLon = 79.7499146;
  const dropLat = 12.982837;
  const dropLon = 80.1683282;

  console.log('=== REVERSE GEOCODING ===');
  console.log('Getting addresses...');
  
  const [pickupAddress, dropAddress] = await Promise.all([
    reverseGeocode(pickupLat, pickupLon),
    reverseGeocode(dropLat, dropLon)
  ]);

  console.log(`Pickup: ${pickupAddress}`);
  console.log(`Drop: ${dropAddress}`);
  console.log('========================\n');

  // Get regular route with tolls
  console.log('=== ROUTE 1: DEFAULT (WITH TOLLS) ===');
  const routeWithTolls = await getRouteWithTolls(pickupLat, pickupLon, dropLat, dropLon);
  if (routeWithTolls) {
    console.log(`Distance: ${routeWithTolls.distance.toFixed(2)} km`);
    console.log(`Duration: ${routeWithTolls.duration} minutes`);
    console.log(`Total Toll: ₹${routeWithTolls.totalToll.toFixed(2)}`);
    console.log(`Number of tolls: ${routeWithTolls.tollCount}`);
    
    // Display each toll individually
    if (routeWithTolls.tollDetails && routeWithTolls.tollDetails.length > 0) {
      console.log('\nIndividual Tolls:');
      routeWithTolls.tollDetails.forEach((toll, index) => {
        const amount = parseTollAmount(toll);
        console.log(`  Toll ${index + 1}: ₹${amount.toFixed(2)}`);
      });
    }
    console.log('========================\n');
  }

  // Get route without tolls
  console.log('=== ROUTE 2: NO TOLLS (SHORTEST WITHOUT TOLLS) ===');
  const routeWithoutTolls = await getRouteWithoutTolls(pickupLat, pickupLon, dropLat, dropLon);
  if (routeWithoutTolls) {
    console.log(`Distance: ${routeWithoutTolls.distance.toFixed(2)} km`);
    console.log(`Duration: ${routeWithoutTolls.duration} minutes`);
    console.log(`Total Toll: ₹${routeWithoutTolls.totalToll.toFixed(2)}`);
    console.log(`Number of tolls: ${routeWithoutTolls.tollCount}`);
    
    if (routeWithoutTolls.tollDetails && routeWithoutTolls.tollDetails.length > 0) {
      console.log('\nIndividual Tolls:');
      routeWithoutTolls.tollDetails.forEach((toll, index) => {
        const amount = parseTollAmount(toll);
        console.log(`  Toll ${index + 1}: ₹${amount.toFixed(2)}`);
      });
    } else {
      console.log('✅ No tolls on this route!');
    }
    console.log('========================\n');
  }

  // Get alternative routes
  console.log('=== ALL ALTERNATIVE ROUTES ===');
  const alternatives = await getRouteAlternatives(pickupLat, pickupLon, dropLat, dropLon);
  if (alternatives.length > 0) {
    alternatives.forEach((route, index) => {
      console.log(`\nRoute ${index + 1}:`);
      console.log(`  Distance: ${route.distance.toFixed(2)} km`);
      console.log(`  Duration: ${route.duration} minutes`);
      console.log(`  Total Toll: ₹${route.totalToll.toFixed(2)}`);
      
      if (route.tollDetails && route.tollDetails.length > 0) {
        console.log(`  Number of tolls: ${route.tollCount}`);
        console.log('  Individual Tolls:');
        route.tollDetails.forEach((toll, idx) => {
          const amount = parseTollAmount(toll);
          console.log(`    Toll ${idx + 1}: ₹${amount.toFixed(2)}`);
        });
      } else {
        console.log('  No tolls on this route');
      }
    });
  }
  console.log('========================\n');

  // Comparison
  if (routeWithTolls && routeWithoutTolls) {
    console.log('=== COMPARISON ===');
    const distDiff = routeWithoutTolls.distance - routeWithTolls.distance;
    const timeDiff = routeWithoutTolls.duration - routeWithTolls.duration;
    const tollDiff = routeWithoutTolls.totalToll - routeWithTolls.totalToll;
    
    console.log(`With Tolls vs No Tolls:`);
    console.log(`  Distance difference: ${distDiff.toFixed(2)} km ${distDiff > 0 ? '(longer without tolls)' : '(shorter without tolls)'}`);
    console.log(`  Time difference: ${timeDiff} minutes ${timeDiff > 0 ? '(longer without tolls)' : '(shorter without tolls)'}`);
    console.log(`  Toll savings: ₹${(routeWithTolls.totalToll - routeWithoutTolls.totalToll).toFixed(2)}`);
    console.log('===================');
  }
}

// Run the main function
main().catch(console.error);
```
