const ipWhitelistMiddleware = (req, res, next) => {
  // Skip in development mode if needed
  if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_IP_WHITELIST) {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress;
  const whitelist = process.env.IP_WHITELIST 
    ? process.env.IP_WHITELIST.split(',').map(ip => ip.trim())
    : [];

  // Check if IP is in whitelist
  const isWhitelisted = whitelist.some(whitelistedIp => {
    // Handle IPv4/IPv6 conversion if needed
    return clientIp.includes(whitelistedIp) || whitelistedIp === clientIp;
  });

  if (!isWhitelisted && whitelist.length > 0) {
    console.warn(`Blocked request from non-whitelisted IP: ${clientIp}`);
    return res.status(403).json({ 
      message: 'Access denied. IP not whitelisted.' 
    });
  }

  next();
};

module.exports = { ipWhitelistMiddleware };