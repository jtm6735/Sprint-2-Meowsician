
// An IIFE ("Iffy") - see the notes in mycourses
(function(){
    "use strict";
    
    let NUM_SAMPLES = 128;
    let backgroundColor = "#ffffff";
    let color = "#eb4034";

    let audioElement;
    let analyserNode;

    let canvasBob;
    let canvas,ctx;
    let grad, songName;
    let bassFilter, trebleFilter;
    let bass=0, treble=0;
    
    let mouth, leftEar, rightEar, nose, head, leftEye, rightEye, leftCheek, rightCheek, leftEyebrow, rightEyebrow;

    function init(){
        // set up canvas stuff
        canvas = document.querySelector('canvas');
        ctx = canvas.getContext("2d");

        // get reference to <audio> element on page
        audioElement = document.querySelector('audio');
        
        // call our helper function and get an analyser node
        analyserNode = createWebAudioContextWithAnalyserNode(audioElement);
        
        // Find facial features
        mouth = new Image();
        mouth.src = "/media/mouth.png";
        leftEar = new Image();
        leftEar.src = "media/left-ear.png";
        rightEar = new Image();
        rightEar.src = "media/right-ear.png";
        nose = new Image();
        nose.src = "media/nose.png";
        head = new Image();
        head.src = "media/head.png";
        leftEye = new Image();
        leftEye.src = "media/left-eye.png";
        rightEye = new Image();
        rightEye.src = "media/right-eye.png";
        leftCheek = new Image();
        leftCheek.src = "media/left-cheek.png";
        rightCheek = new Image();
        rightCheek.src = "media/right-cheek.png";
        leftEyebrow = new Image();
        leftEyebrow.src = "media/left-eyebrow.png";
        rightEyebrow = new Image();
        rightEyebrow.src = "media/right-eyebrow.png";

        // get sound track <select> and Full Screen button working
        setupUI();
        
        // start animation loop
        update();
    }

    function createWebAudioContextWithAnalyserNode(audioElement) {
        let audioCtx, analyserNode, sourceNode;
        // create new AudioContext
        // The || is because WebAudio has not been standardized across browsers yet
        // http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
        audioCtx = new (window.AudioContext || window.webkitAudioContext);
        
        // create an analyser node
        analyserNode = audioCtx.createAnalyser();
        
        /*
        We will request NUM_SAMPLES number of samples or "bins" spaced equally 
        across the sound spectrum.
        
        If NUM_SAMPLES (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
        the third is 344Hz. Each bin contains a number between 0-255 representing 
        the amplitude of that frequency.
        */ 
        
        // fft stands for Fast Fourier Transform
        analyserNode.fftSize = NUM_SAMPLES;
        
        // this is where we hook up the <audio> element to the analyserNode
        sourceNode = audioCtx.createMediaElementSource(audioElement); 
        
        //add bass boost
        bassFilter = audioCtx.createBiquadFilter();
        bassFilter.type = "lowshelf";
        bassFilter.frequency.value = 200;
        bassFilter.gain.value = bass;
        
        //add treble boost
        trebleFilter = audioCtx.createBiquadFilter();
        trebleFilter.type = "highshelf";
        trebleFilter.frequency.value = 2000;
        trebleFilter.gain.value = treble;
        
        sourceNode.connect(bassFilter);
        bassFilter.connect(trebleFilter);
        trebleFilter.connect(analyserNode);

        // here we connect to the destination i.e. speakers
        analyserNode.connect(audioCtx.destination);
        return analyserNode;
    }
    
    function setupUI(){
        document.querySelector("#bassBoost").onchange = function(e){
            bass = e.target.value;
            bassFilter.gain.value = bass;
            document.getElementById("currentBass").innerHTML = e.target.value;
        }
        
        document.querySelector("#trebleBoost").onchange = function(e){
            treble = e.target.value;
            trebleFilter.gain.value = treble;
            document.getElementById("currentTreble").innerHTML = e.target.value;
        }

        // get reference to file input and listen for changes
        document.querySelector('#file').onchange = function(e){
            var sound = document.getElementById('sound');
            sound.src = URL.createObjectURL(this.files[0]);
            //document.querySelector("#status").innerHTML = "Now playing: " + e.target.value;
            audioElement.volume = 0.2;
            audioElement.play();
            sound.onend = function(e){
                URL.revokeObjectURL(this.src); 
            }
        }
    }
    
    function update() { 
        // this schedules a call to the update() method in 1/60 seconds
        requestAnimationFrame(update);
        
        /*
            Nyquist Theorem
            http://whatis.techtarget.com/definition/Nyquist-Theorem
            The array of data we get back is 1/2 the size of the sample rate 
        */
        
        // create a new array of 8-bit integers (0-255), array of 64 data points 
        let data = new Uint8Array(NUM_SAMPLES/2); 
        let waveData = new Uint8Array(NUM_SAMPLES/2);

        // populate the array with the frequency data
        // notice these arrays can be passed "by reference" 
        analyserNode.getByteFrequencyData(data); //frequency data 
        analyserNode.getByteTimeDomainData(waveData); // waveform data
        
        // mouth uses first third of audio range
        let mouthData = 0;
        for (var i = 0; i < 20; i++){
            mouthData = mouthData + data[i];
        }
        mouthData = mouthData / 20;

        // uses second third of audio range
        let earData = 0; 
        for (var i = 20; i < 40; i++){
            earData = earData + data[i];
        }
        earData = earData / 20;

        // nose uses last third of audio range
        let noseData = 0;
        for (var i = 40; i < 46; i++){
            noseData = noseData + data[i];
        }
        noseData = noseData / 6;

        // clear screen
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, 1080, 850);
        
        ctx.save();
        ctx.fillStyle = backgroundColor;
        ctx.strokeStyle ="rgba(221, 221, 221, 0.4)";
        ctx.lineWidth = 2;
        
        ctx.restore();

        //Draw Ears
        ctx.save();
        ctx.translate(390,200);
        ctx.rotate(-(earData*Math.PI/180)/15);
        ctx.drawImage(leftEar,(-2 * leftEar.width/3),(-2 * leftEar.width/3));
        ctx.restore();

        ctx.save();
        ctx.translate(685,200);
        ctx.rotate((earData*Math.PI/180)/15);
        ctx.drawImage(rightEar,(-1 * rightEar.width/3),(-2 * rightEar.width/3));
        ctx.restore();

        //Draw Face
        ctx.drawImage(head, 220, 150); // drw image with scaled width and height

        //Draw Eyes
        ctx.drawImage(leftEye, 370, 200);
        ctx.drawImage(rightEye, 590, 200);

        //Draw Eyes
        ctx.drawImage(leftEyebrow, 365, 180);
        ctx.drawImage(rightEyebrow, 570, 190);

        //Draw Cheeks
        ctx.drawImage(leftCheek, 80, 510);
        ctx.drawImage(rightCheek, 630, 510);

        //Draw Mouth
        ctx.save();
        // scale the image and make sure it isn't too small
        var mouthScale = mouthData / 100;
        var mouthHeight;
        if (mouth.height > (mouth.height * mouthScale)){
            mouthHeight = mouth.height;
        } else {
            mouthHeight = mouth.height * mouthScale;
        }
        var mouthWidth;
        if (mouth.width > (mouth.width * mouthScale)){
            mouthWidth = mouth.width;
        } else {
            mouthWidth = mouth.width * mouthScale;
        }
        var x = (ctx.canvas.width - mouthWidth) / 2;
        var y = ((ctx.canvas.height - mouthHeight) / 2) + 215;
        ctx.drawImage(mouth, x, y, mouthWidth, mouthHeight); // drw image with scaled width and height
        //ctx.drawImage(mouth, 525+mouth.width/2, 450+mouth.height/2, ((100 + mouthData * 0.2)), ((100 + mouthData * 0.2)));
        ctx.restore();
        
        //Draw Nose
        ctx.save();
        // scale the image and make sure it isn't too small
        var noseScale = noseData / 60;
        var noseHeight;
        if (nose.height > (nose.height * noseScale)){
            noseHeight = nose.height;
        } else {
            noseHeight = nose.height * noseScale;
        }
        var noseWidth;
        if (nose.width > (nose.width * noseScale)){
            noseWidth = nose.width;
        } else {
            noseWidth = nose.width * noseScale;
        }
        var x = (ctx.canvas.width - noseWidth) / 2;
        var y = ((ctx.canvas.height - noseHeight) / 2) + 85;
        ctx.drawImage(nose, x, y, noseWidth, noseHeight); // drw image with scaled width and height
        //ctx.drawImage(mouth, 525+mouth.width/2, 450+mouth.height/2, ((100 + mouthData * 0.2)), ((100 + mouthData * 0.2)));
        ctx.restore();
        
        canvasBob = earData / 100;
        canvasBob = canvasBob + 10;

        document.getElementById('canvas-container').style.top = canvasBob + '%';
        //Draw Song name, if we want to draw text? 
        /*
        ctx.save();
        ctx.font = "25px Indie Flower";
        ctx.fillStyle = "rgba(235, 64, 52, 1)";
        ctx.fillText("BeeKoo Mix", 50, 50);
        ctx.restore();
        */
    } 

    window.addEventListener("load",init);

    /*
    // FULL SCREEN MODE - Do we want this? 
    
    function requestFullscreen(element) {
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.mozRequestFullscreen) {
          element.mozRequestFullscreen();
        } else if (element.mozRequestFullScreen) { // camel-cased 'S' was changed to 's' in spec
          element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        }
        // .. and do nothing if the method is not supported
    }; */
}());

function navigateToMeowsician(){
    window.location.href = 'meowsician.html';
}