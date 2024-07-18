const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { SpeechConfig, SpeechSynthesizer, AudioConfig, SpeechRecognizer } = require('microsoft-cognitiveservices-speech-sdk');


const app = express();
const port = 3000;

const subscriptionKey = '51a62e70850c47a0a38001dd4cd8019d';
const serviceRegion = 'westeurope';

const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, '../client')));
app.use(express.json());

app.post('/synthesize', async (req, res) => {
    const { text } = req.body;
    const speechConfig = SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    const audioConfig = AudioConfig.fromAudioFileOutput(path.join(__dirname, 'output.wav'));
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(text,
        result => {
            synthesizer.close();
            res.sendStatus(200);
        },
        err => {
            console.error(err);
            synthesizer.close();
            res.status(500).send('Error en la síntesis de texto a voz');
        });
});

app.post('/recognize', upload.single('audio'), (req, res) => {
    const filePath = req.file.path;
    const speechConfig = SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    const audioConfig = AudioConfig.fromWavFileInput(fs.readFileSync(filePath));
    const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(result => {
        fs.unlinkSync(filePath); // Eliminar el archivo temporal
        recognizer.close();
        res.json({ text: result.text });
    }, err => {
        fs.unlinkSync(filePath); // Eliminar el archivo temporal
        recognizer.close();
        console.error(err);
        res.status(500).send('Error en el reconocimiento de voz');
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

