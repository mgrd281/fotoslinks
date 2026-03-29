import fs from 'fs';
import path from 'path';

const imagePath = path.join(process.cwd(), 'public', 'cityscape.jpg');

export default async function handler(req, res) {
  // Set image headers
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  
  // Read and send image
  const image = fs.readFileSync(imagePath);
  res.status(200).send(image);
}
