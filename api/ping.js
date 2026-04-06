module.exports = (req, res) => {
  res.status(200).json({ 
    status: 'online', 
    message: 'API Routing is Working Correctlly!',
    timestamp: new Date().toISOString()
  });
};
