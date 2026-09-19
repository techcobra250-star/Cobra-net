// Express 4 ne capture pas automatiquement les erreurs des handlers async
// (contrairement à Express 5) : sans ce wrapper, une erreur de base de données
// resterait une "unhandled rejection" et le client ne recevrait jamais de
// réponse. On enveloppe systématiquement pour rester stable.
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = { asyncHandler };
