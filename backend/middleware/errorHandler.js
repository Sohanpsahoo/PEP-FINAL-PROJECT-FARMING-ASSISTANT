// Global error handling middleware
// Add more custom error handling logic here as the app grows

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Axios errors (from OpenWeatherMap calls)
  if (err.response) {
    return res.status(err.response.status || 502).json({
      error: 'External API error',
      message: err.response.data?.message || err.message,
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation Error', messages });
  }

  // Default
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
