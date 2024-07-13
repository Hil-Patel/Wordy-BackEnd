const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const signUpRoutes = require('./routes/user');

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,FETCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    next();
});

app.use(signUpRoutes);

mongoose.connect('mongodb+srv://niravpatel0804:Wordy0801@cluster1.ou3nmi1.mongodb.net/Wordy?retryWrites=true&w=majority&appName=Cluster1')
    .then(res => {
        app.listen(8000);
    })
    .catch(err => {
        console.log(err);
    });
