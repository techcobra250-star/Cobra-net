const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { asyncHandler } = require('../asyncHandler');

const router = express.Router();

// Limite les tentatives de connexion : 10 essais / 15 min / IP.
// Protège contre le brute-force du mot de passe admin.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' }
});

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'username et password requis.' });
    }

    // Un seul compte admin (vous, le propriétaire du service) — pas de
    // création de compte public, conforme au cahier des charges initial.
    const validUsername = username === process.env.ADMIN_USERNAME;
    const validPassword = validUsername
        ? await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)
        : false;

    if (!validUsername || !validPassword) {
        // Message volontairement identique dans les deux cas (username ou
        // password incorrect) pour ne pas révéler quel champ est faux.
        return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const token = jwt.sign(
        { sub: username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
    );

    res.json({ token, expiresIn: '12h' });
}));

module.exports = router;
