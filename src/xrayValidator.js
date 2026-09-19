// Même logique que XrayConfigValidator.kt côté Android : validation
// structurelle minimale (outbounds + protocole reconnu), pas une validation
// exhaustive du schéma Xray. Sert de garde-fou côté serveur : ne JAMAIS faire
// confiance uniquement à la validation faite côté client.
const KNOWN_PROTOCOLS = ['vmess', 'vless', 'trojan', 'shadowsocks', 'socks', 'http', 'wireguard'];

function validateXrayConfig(rawText) {
    const errors = [];

    if (!rawText || typeof rawText !== 'string' || rawText.trim() === '') {
        return { valid: false, errors: ['Le JSON est vide.'] };
    }

    let root;
    try {
        root = JSON.parse(rawText);
    } catch (e) {
        return { valid: false, errors: [`JSON invalide : ${e.message}`] };
    }

    if (typeof root !== 'object' || root === null || Array.isArray(root)) {
        return { valid: false, errors: ['La racine du JSON doit être un objet.'] };
    }

    if (!Array.isArray(root.outbounds) || root.outbounds.length === 0) {
        errors.push('"outbounds" doit être un tableau non vide.');
    } else {
        const firstOutbound = root.outbounds[0];
        const protocol = firstOutbound && firstOutbound.protocol;
        if (!protocol) {
            errors.push('Le premier outbound n\'a pas de champ "protocol".');
        } else if (!KNOWN_PROTOCOLS.includes(String(protocol).toLowerCase())) {
            errors.push(`Protocole "${protocol}" non reconnu.`);
        }
    }

    return { valid: errors.length === 0, errors };
}

module.exports = { validateXrayConfig };
