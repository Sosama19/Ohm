const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Image } = require('image-js');
const mobilenet = require('@tensorflow-models/mobilenet');

const app = express();
const port = process.env.PORT || 3000;

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle image upload and perform object recognition
app.post('/api/upload', upload.single('image'), async (req, res) => {
    console.log('Received POST request at /api/upload');

    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        console.log('Processing uploaded file:', req.file.path);
        const imagePath = path.join(__dirname, req.file.path);
        const img = await Image.load(imagePath);

        console.log('Loading MobileNet model');
        const model = await mobilenet.load();
        console.log('Classifying image');
        const predictions = await model.classify(img);
        const objects = predictions.map(p => p.className);

        // Clean up uploaded file
        fs.unlinkSync(imagePath);
        console.log('File processed and deleted');

        res.status(200).json({ objects });
    } catch (error) {
        console.error('Error processing image:', error.message);
        res.status(500).json({ error: 'Error processing image' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
