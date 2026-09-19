const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { validateXrayConfig } = require('../xrayValidator');
const { asyncHandler } = require('../asyncHandler');

const router = express.Router();
router.use(requireAuth); // toutes les routes ci-dessous exigent un jeton valide

function toApiShape(row) {
    return {
        id: row.id,
        clientId: row.client_id,
        name: row.name,
        xrayJson: row.xray_json,
        displayServer: row.display_server,
        displayPort: row.display_port,
        displayProtocol: row.display_protocol,
        activationDate: row.activation_date,
        expirationDate: row.expiration_date,
        enabled: row.enabled
    };
}

// GET /api/profiles
router.get('/', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM vpn_profiles ORDER BY expiration_date ASC');
    res.json(result.rows.map(toApiShape));
}));

// GET /api/profiles/:id
router.get('/:id', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM vpn_profiles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profil introuvable.' });
    res.json(toApiShape(result.rows[0]));
}));

// POST /api/profiles
router.post('/', asyncHandler(async (req, res) => {
    const { clientId, name, xrayJson, displayServer, displayPort, displayProtocol, expirationDate } = req.body;

    if (!clientId || !name || !xrayJson || !expirationDate) {
        return res.status(400).json({ error: 'clientId, name, xrayJson et expirationDate sont requis.' });
    }

    const validation = validateXrayConfig(xrayJson);
    if (!validation.valid) {
        return res.status(400).json({ error: 'Config Xray invalide.', details: validation.errors });
    }

    const result = await pool.query(
        `INSERT INTO vpn_profiles (client_id, name, xray_json, display_server, display_port, display_protocol, expiration_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [clientId, name, xrayJson, displayServer || null, displayPort || null, displayProtocol || null, expirationDate]
    );

    res.status(201).json(toApiShape(result.rows[0]));
}));

// PUT /api/profiles/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { name, xrayJson, displayServer, displayPort, displayProtocol, enabled } = req.body;

    if (xrayJson) {
        const validation = validateXrayConfig(xrayJson);
        if (!validation.valid) {
            return res.status(400).json({ error: 'Config Xray invalide.', details: validation.errors });
        }
    }

    const result = await pool.query(
        `UPDATE vpn_profiles SET
            name = COALESCE($1, name),
            xray_json = COALESCE($2, xray_json),
            display_server = COALESCE($3, display_server),
            display_port = COALESCE($4, display_port),
            display_protocol = COALESCE($5, display_protocol),
            enabled = COALESCE($6, enabled)
         WHERE id = $7 RETURNING *`,
        [name, xrayJson, displayServer, displayPort, displayProtocol, enabled, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Profil introuvable.' });
    res.json(toApiShape(result.rows[0]));
}));

// DELETE /api/profiles/:id
router.delete('/:id', asyncHandler(async (req, res) => {
    const result = await pool.query('DELETE FROM vpn_profiles WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profil introuvable.' });
    res.status(204).send();
}));

// POST /api/profiles/:id/renew
router.post('/:id/renew', asyncHandler(async (req, res) => {
    const extraDays = Number(req.body.extraDays) || 30;
    if (extraDays <= 0 || extraDays > 3650) {
        return res.status(400).json({ error: 'extraDays doit être compris entre 1 et 3650.' });
    }

    // On prolonge depuis la date d'expiration existante si elle n'est pas
    // encore passée, sinon depuis maintenant — même logique que côté Android.
    const result = await pool.query(
        `UPDATE vpn_profiles
         SET expiration_date = GREATEST(expiration_date, now()) + ($1 || ' days')::interval
         WHERE id = $2 RETURNING *`,
        [extraDays, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Profil introuvable.' });
    res.json(toApiShape(result.rows[0]));
}));

module.exports = router;
