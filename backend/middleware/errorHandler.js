const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);
    const message = err.message || 'Server error';

    if (statusCode >= 500) {
        console.error(err.stack || err);
    }

    res.status(statusCode).json({
        error: message,
    });
};

module.exports = errorHandler;
