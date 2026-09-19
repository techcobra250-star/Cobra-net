require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profiles');

const app = express();

app.use(helmet());
app.use(cors()); // l'app Android n'est pas un navigateur, CORS large est sans risque ici
app.use(express.json({ limit: '256kb' })); // limite raisonnable, une config Xray reste petite

// Endpoint de santé pour Render (et pour vérifier rapidement que l'API tourne).
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);

// Gestion d'erreur générique : ne jamais renvoyer la stack trace au client.
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Cobra Net API démarrée sur le port ${port}`);
});
