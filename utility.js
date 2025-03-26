function logWithRequestId(reqId, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}][${reqId}] ${message}`);
}

module.exports = {
	logWithRequestId,
}