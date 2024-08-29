const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Image } = require('image-js');
const mobilenet = require('@tensorflow-models/mobilenet');

const upload = multer({ dest: '/tmp/' });  // Use /tmp for temporary storage in serverless functions

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        upload.single('image')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: 'Upload error' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            try {
                const imagePath = path.join('/tmp', req.file.filename);
                const img = await Image.load(imagePath);

                const model = await mobilenet.load();
                const predictions = await model.classify(img);
                const objects = predictions.map(p => p.className);

                fs.unlinkSync(imagePath);

                res.status(200).json({ objects });
            } catch (error) {
                console.error('Error processing image:', error);
                res.status(500).json({ error: 'Error processing image' });
            }
        });
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
};
