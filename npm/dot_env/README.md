# dot_env

1. **Create NPM Project**

```
under project_name -> 
```

In Terminal

```
npm init --y
```

2. **Install dotenv**

Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env. 


Storing configuration in the environment separate from code is based on The Twelve-Factor App methodology.

dotenv
https://www.npmjs.com/package/dotenv

In Terminal 

```
npm install dotenv
```

3. Folder Setup

Folder Setup

```
under project_name -> src
```

File Setup

```
under project_name -> .env
```

```
under project_name -> src -> index.js
```

4. open `.env`

```
API_KEY=12345678910

DB_HOST=localhost

DB_USER=root

DB_PASS=s1mpl3

DB_NAME="some_db"
```

5. open `index.js`

```
require('dotenv').config()

console.log(process.env.API_KEY);

console.log(process.env.DB_HOST);

console.log(process.env.DB_USER);

console.log(process.env.DB_PASS);

console.log(process.env.DB_NAME);
```

4. open `package.json`

```
"scripts": {
    "dev" : "node src/index.js"
},
```