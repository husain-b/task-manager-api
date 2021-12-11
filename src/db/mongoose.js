const { ConnectionClosedEvent } = require('mongodb');
const mongoose = require('mongoose');

// import mongoose from 'mongoose';
// import validator from 'validator';

mongoose.connect(process.env.MONGODB_URI);