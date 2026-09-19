const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET manquant. Configurez-le dans les variables d\'environnement.');
}

/**
 * Protège une route : exige un en-tête "Authorization: Bearer <token>" valide.
 * Aucune route /api/profiles/* ne doit être accessible sans passer par ici.
 */
function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Jeton invalide ou expiré.' });
    }
}

module.exports = { requireAuth };
