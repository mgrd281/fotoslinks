import fs from 'fs';
import path from 'path';

const cityscapePath = path.join(process.cwd(), 'public', 'cityscape.jpg');

export default async function handler(req, res) {
  const { slug } = req.query;
  const imageName = slug.join('/');
  
  // Log the access for tracking
  console.log('Image accessed:', {
    path: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress,
    referer: req.headers.referer,
    timestamp: new Date().toISOString()
  });
  
  // Set proper image headers
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(cityscapePath);
    
    // Return status 200 with the image
    res.status(200).send(imageBuffer);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(404).json({ error: 'Image not found' });
  }
}
