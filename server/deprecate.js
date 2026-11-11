// deprecate.js: Adds standard RFC deprecation and sunset headers to retiring endpoints
function deprecated({ sunset, successor }) {
    return (req, res, next) => {
        res.set('Deprecation', 'true');
        res.set('Sunset', new Date(sunset).toUTCString());
        res.set('Link', `<${successor}>; rel="successor-version"`);
        next();
    };
}

module.exports = { deprecated };
