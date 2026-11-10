'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const app = require('./app');
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Sweety API listening at http://localhost:${port}`));
