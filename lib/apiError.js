function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function errorResponse(error) {
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return { body: { error: 'Please log in to get full access' }, status: 401 };
  }

  return {
    body: { error: error.message || 'Something went wrong' },
    status: Number(error.status) || 400,
  };
}

module.exports = {
  httpError,
  errorResponse,
};