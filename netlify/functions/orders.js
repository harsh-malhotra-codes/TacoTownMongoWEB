exports.handler = async function () {
    return {
        statusCode: 501,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Use backend /api/orders endpoint with MongoDB.' })
    };
};
