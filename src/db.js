const { Pool } = require('pg');

// DATABASE_URL vient TOUJOURS d'une variable d'environnement (Render), jamais
// écrite en dur ici — conformément à la règle "pas de clés secrètes dans le code".
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL manquant. Configurez-le dans les variables d\'environnement.');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon exige SSL ; rejectUnauthorized:false est la config standard
    // recommandée par Neon pour les connexions depuis un hébergeur tiers comme Render.
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;
