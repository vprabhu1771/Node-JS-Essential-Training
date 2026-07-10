Sequelize natively supports geospatial features like GEOMETRY and GEOGRAPHY data types for PostgreSQL, MySQL, and MariaDB. It seamlessly parses standard GeoJSON objects (formatted as { type: 'Point', coordinates: [lng, lat] }) and enables location-based queries such as finding distances or items within a specific radius.

# 1. Defining a Geospatial Column

You can define a spatial column (such as a Point, LineString, or Polygon) using the `DataTypes.GEOMETRY` or `DataTypes.GEOGRAPHY` property.

```
const { DataTypes } = require('sequelize');

const Location = sequelize.define('Location', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  coordinate: {
    type: DataTypes.GEOMETRY('POINT', 4326), // POINT type with SRID 4326 (WGS 84)
    allowNull: false
  }
});
```

# 2. Inserting Data
When inserting data, provide standard GeoJSON. Note that coordinates must always be supplied in [Longitude, Latitude] order (Long, Lat).

```
await Location.create({
  name: 'Central Park',
  coordinate: {
    type: 'Point',
    coordinates: [-73.968285, 40.785091] // [Longitude, Latitude]
  }
});
```

# 3. Querying Locations by Distance

To find points within a specific radius (e.g., 10 kilometers) of a target coordinate, use database spatial functions like `ST_Distance_Sphere` wrapped in `sequelize.fn` and `sequelize.literal`.

```
const { fn, literal, where, Op } = require('sequelize');

const targetLng = -73.968285;
const targetLat = 40.785091;
const radiusInMeters = 10000;

// Create target point
const targetPoint = literal(`ST_GeomFromText('POINT(${targetLng} ${targetLat})', 4326)`);

// Calculate distance
const distance = fn('ST_Distance_Sphere', col('coordinate'), targetPoint);

const nearbyLocations = await Location.findAll({
  attributes: {
    include: [[distance, 'distanceInMeters']] // Adds a 'distance' column to the result
  },
  where: where(distance, { [Op.lte]: radiusInMeters }), // Less than or equal to 10km
  order: [[distance, 'ASC']]
});
```

For full reference on all spatial formats and spatial reference systems (SRID), consult the official Sequelize GEOMETRY Docs[https://sequelize.org/api/v6/class/src/data-types.js~geometry] and Sequelize GEOGRAPHY Docs[https://sequelize.org/api/v6/class/src/data-types.js~geography].
