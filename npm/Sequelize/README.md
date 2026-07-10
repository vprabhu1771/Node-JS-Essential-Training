```
https://sequelize.org/
```
# Install dependencies

```
npm install sequelize sqlite3
# or
yarn add sequelize sqlite3
```

# Define models

```
import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize('sqlite::memory:');
const User = sequelize.define('User', {
  username: DataTypes.STRING,
  birthday: DataTypes.DATE,
});
```

# Persist and query

```
const jane = await User.create({
  username: 'janedoe',
  birthday: new Date(1980, 6, 20),
});

const users = await User.findAll();
```
