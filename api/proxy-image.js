export default async function handler(req, res) {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  // Security checks
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTPS
    if (urlObj.protocol !== 'https:') {
      return res.status(400).json({ error: 'Only HTTPS URLs are allowed' });
    }
    
    // Block suspicious domains
    const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
    if (blockedDomains.includes(urlObj.hostname)) {
      return res.status(400).json({ error: 'Blocked domain' });
    }
    
    // Validate image URL with HEAD request
    const headResponse = await fetch(url, { method: 'HEAD' });
    
    if (!headResponse.ok) {
      return res.status(400).json({ error: 'Image not accessible' });
    }
    
    const contentType = headResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL does not point to an image' });
    }
    
    // Fetch the actual image
    const imageResponse = await fetch(url);
    
    if (!imageResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch image' });
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Send the image
    res.status(200).send(Buffer.from(imageBuffer));
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
