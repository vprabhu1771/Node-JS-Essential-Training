## Sequelize Geospatial Integration Guide
Sequelize natively supports geospatial features using GEOMETRY and GEOGRAPHY data types for databases like PostgreSQL, MySQL, and MariaDB. It parses standard GeoJSON objects and enables location-based queries like distance calculations or radius searches.
------------------------------
## 🚀 Quick Start## 1. Define a Geospatial Model
Define a spatial column (such as a Point, LineString, or Polygon) using DataTypes.GEOMETRY or DataTypes.GEOGRAPHY.

const { DataTypes } = require('sequelize');
const Location = sequelize.define('Location', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  coordinate: {
    // Defines a POINT type with SRID 4326 (WGS 84 coordinate system)
    type: DataTypes.GEOMETRY('POINT', 4326), 
    allowNull: false
  }
});

## 2. Insert Geospatial Data
When inserting data, provide a standard GeoJSON object.
⚠️ Important: Coordinates must always be ordered as [Longitude, Latitude].

await Location.create({
  name: 'Central Park',
  coordinate: {
    type: 'Point',
    coordinates: [-73.968285, 40.785091] // [Longitude, Latitude]
  }
});

## 3. Query Locations Within a Radius
Find locations within a specific distance (e.g., 10 kilometers) of a target coordinate using database spatial functions wrapped in sequelize.fn and sequelize.literal.

const { fn, col, literal, where, Op } = require('sequelize');
const targetLng = -73.968285;const targetLat = 40.785091;const radiusInMeters = 10000; // 10 KM
// Generate the target spatial point stringconst targetPoint = literal(`ST_GeomFromText('POINT(${targetLng} ${targetLat})', 4326)`);
// Calculate distance using the native database sphere functionconst distance = fn('ST_Distance_Sphere', col('coordinate'), targetPoint);
const nearbyLocations = await Location.findAll({
  attributes: {
    include: [[distance, 'distanceInMeters']] // Include calculated distance in the response
  },
  where: where(distance, { [Op.lte]: radiusInMeters }), // Filter results within the radius
  order: [[distance, 'ASC']] // Sort by closest location first
});

------------------------------
## 📚 References

* [Sequelize GEOMETRY Documentation](https://sequelize.org/api/v6/class/src/data-types.js~geometry)
* [Sequelize GEOGRAPHY Documentation](https://sequelize.org/api/v6/class/src/data-types.js~geography)

------------------------------
Tell me what SQL database dialect you are using so I can help you write advanced spatial queries for bounding boxes, intersections, or polygon containment.

