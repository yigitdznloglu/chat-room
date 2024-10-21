'use strict';
const crypto = require('crypto');

const generateSalt = (rounds = 10) => {
    if (rounds >= 15) {
        throw new Error(`${rounds} is greater than 15, must be less than 15`);
    }
    if (typeof rounds !== 'number') {
        throw new Error('Rounds parameter must be a number');
    }
    return crypto.randomBytes(Math.ceil(rounds / 2)).toString('hex').slice(0, rounds);
};

const hasher = (password, salt) => {
    const hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    const value = hash.digest('hex');
    return {
        salt: salt,
        hashedPassword: value
    };
};

const hashPassword = (password) => {
    const salt = generateSalt(10);
    if (password == null || salt == null) {
        throw new Error(`Must provide password and salt values: ${password} ${salt}`);
    }
    if (typeof password !== 'string' || typeof salt !== 'string') {
        throw new Error('Password must be a string and salt must either be a salt string or a number of rounds');
    }
    return hasher(password, salt);
};

const comparePassword = (password, hash) => {
    if (password == null || hash == null) {
        throw new Error('Password and hash are required to compare');
    }
    if (typeof password !== 'string' || typeof hash !== 'object') {
        throw new Error('Password must be a string and hash must be an object');
    }
    const passwordData = hasher(password, hash.salt);
    return passwordData.hashedPassword === hash.hashedPassword;
};

module.exports = {
    generateSalt,
    hashPassword,
    comparePassword
};
