const { catchAsync } = require('../utils/errorUtils');
const successResponse = require('../utils/successResponse');

const checkHealth = catchAsync(async (req, res, next) => {
  const healthcheck = {
		uptime: process.uptime(),
		message: 'OK',
		timestamp: Date.now()
	};
  successResponse(res, 200, 'Application is healthy', { healthcheck });
});

module.exports = { checkHealth };