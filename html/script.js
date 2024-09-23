const startButton = document.getElementById('startButton');
const status = document.getElementById('status');
const chatBox = document.getElementById('chatBox');
let ws;
let recognition;
let currentAudio = null;  

let audioContext;
let analyserInput, analyserOutput;
let dataArrayInput, dataArrayOutput;
let bufferLengthInput, bufferLengthOutput;
let stream;  

// Função para exibir a mensagem na caixa de diálogo estilo chatbot
function addChatMessage(text, isUser = true) {
    const message = document.createElement('div');
    message.classList.add(isUser ? 'userText' : 'botText');
    message.innerText = text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;  // Auto-scroll para a mensagem mais recente
}

// Função para iniciar o reconhecimento de fala
function startRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'pt-BR';  // Definir idioma como português do Brasil

        recognition.onstart = () => {
            status.innerText = 'Reconhecimento de fala ativado. Fale no microfone.';
        };

        recognition.onresult = (event) => {
            let transcript = event.results[event.resultIndex][0].transcript;
            addChatMessage(transcript, true);  // Adicionar mensagem do usuário
            // Enviar o texto reconhecido via WebSocket
            ws.send(transcript);
        };

        recognition.onerror = (event) => {
            status.innerText = 'Erro no reconhecimento de fala: ' + event.error;
        };

        recognition.onend = () => {
            recognition.start(); // Reiniciar o reconhecimento contínuo
        };

        recognition.start();
    } else {
        status.innerText = 'Seu navegador não suporta a Web Speech API.';
    }
}

// Função para sintetizar o texto usando a API do Azure
async function synthesizeTextToSpeech(text) {
    const speechKey = '2b204d187e5644f5b27ee2015ce60f06'; // Substitua com sua chave do Azure Speech
    const serviceRegion = 'brazilsouth';  // Região do serviço do Azure
    const endpoint = `https://${serviceRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3'
            },
            body: `
                <speak version='1.0' xml:lang='pt-BR'>
                    <voice xml:lang='pt-BR' xml:gender='Female' name='pt-BR-BrendaNeural'>
                        ${text}
                    </voice>
                </speak>`
        });

        if (!response.ok) {
            throw new Error('Erro na síntese de voz: ' + response.statusText);
        }

        const audioData = await response.arrayBuffer();
        playAudio(audioData);

    } catch (error) {
        console.error('Erro durante a síntese de voz:', error);
    }
}

// Função para reproduzir o áudio sintetizado
function playAudio(audioData) {
    if (currentAudio) {
        currentAudio.pause();
    }

    const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
    currentAudio = new Audio(URL.createObjectURL(audioBlob));
    currentAudio.play();
}

// Solicitar permissão de uso do microfone apenas uma vez e manter o stream
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(audioStream => {
        stream = audioStream;  // Armazenar o stream globalmente
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    })
    .catch(error => {
        console.error('Erro ao acessar o microfone:', error);
    });

// Configura o WebSocket e inicia o reconhecimento de fala e o visualizador de áudio
startButton.onclick = () => {
    //ws = new WebSocket('ws://localhost:8080/ws');    
    ws = new WebSocket('wss://18.118.104.227:8080/ws');
    ws.onopen = () => {
        startRecognition();       
    };
    ws.onmessage = (event) => {
        addChatMessage(event.data, false);  // Adicionar mensagem do bot
        synthesizeTextToSpeech(event.data);  // Sintetizar o texto recebido
    };
    ws.onerror = (event) => {
        console.error('Erro no WebSocket:', event);
    };
    ws.onclose = () => {
        recognition.stop();
        status.innerText = 'WebSocket desconectado.';
    };
};
