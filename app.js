const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = express();

dotenv.config();
const signUpRoutes = require('./routes/user');

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,FETCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    next();
});

app.use(signUpRoutes);

mongoose.connect(process.env.MONGO_URL)
    .then(res => {
        app.listen(8000);
    })
    .catch(err => {
        console.log(err);
    });
