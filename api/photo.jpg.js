import fs from 'fs';
import path from 'path';

const cityscapePath = path.join(process.cwd(), 'public', 'cityscape.jpg');

export default async function handler(req, res) {
  // Collect request data for tracking
  const requestData = {
    path: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
    referer: req.headers.referer,
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers
  };
  
  // Send tracking data to Discord webhook
  try {
    const payload = `**📸 Image Accessed**\n` +
      `**URL:** ${req.url}\n` +
      `**IP:** ${requestData.ip}\n` +
      `**User-Agent:** ${requestData.userAgent}\n` +
      `**Referer:** ${requestData.referer || 'Direct'}\n` +
      `**Time:** ${requestData.timestamp}`;
    
    const discordPayload = JSON.stringify({ content: payload });
    
    // Send to Discord (non-blocking)
    fetch('https://discordapp.com/api/webhooks/1487781638401163385/AB1V9_A3C1uS1xBluFpNX4gy4zIn6XyXxx83hlvPsuMrNhBd0Huo7epfA-Em0vm-KtF', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: discordPayload
    }).catch(err => console.log('Discord notification failed:', err));
    
  } catch (error) {
    console.log('Tracking error:', error);
  }
  
  // Set proper image headers
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    // Read and serve the image
    const imageBuffer = fs.readFileSync(cityscapePath);
    res.status(200).send(imageBuffer);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(404).json({ error: 'Image not found' });
  }
}
