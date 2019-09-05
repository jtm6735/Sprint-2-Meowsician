// Don't need canvas?
// An IIFE ("Iffy") - see the notes in mycourses
(function(){
    "use strict";
    
    let NUM_SAMPLES = 128;
    let backgroundColor = "#ffffff";
    let color = "#eb4034";

    let audioElement;
    let analyserNode;

    let canvas,ctx;
    let grad, songName;
    let bassFilter, trebleFilter;
    let bass=0, treble=0;
    
    let mouth, ears, nose;

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
        mouth.src = "/media/circle.png";
        ears = new Image();
        ears.src = "media/circle.png";
        nose = new Image();
        nose.src = "media/circle.png";

        // get sound track <select> and Full Screen button working
        setupUI();
        
        // load and play default sound into audio element
        playStream(audioElement, "BeeKooMix");
        
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
        /*
        document.querySelector("#trackSelect").onchange = function(e){
            playStream(audioElement,e.target.value);
        };
        
        document.querySelector("#fsButton").onclick = function(){
            requestFullscreen(canvas);
        };
        
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
        */
    }
    
    function playStream(audioElement,path){
        songName = path;
        audioElement.src = "media/" + path + ".mp3";
        audioElement.play();
        audioElement.volume = 0.2;
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
        
        // find averages of data
        let mouthData = 0;
        for (var i = 0; i < 20; i++){
            mouthData = mouthData + data[i];
        }
        mouthData = mouthData / 20;
         // uses first third of audio range
        let earData; // uses second third of audio range
        let noseData; // uses final third of audio range

        // clear screen
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, 1280, 800);
        
        ctx.save();
        ctx.fillStyle =backgroundColor;
        ctx.strokeStyle ="rgba(221, 221, 221, 0.4)";
        ctx.lineWidth = 2;
        
        ctx.restore();

        //Draw Face
        //Draw Mouth
        ctx.drawImage(mouth, 525, 450+(mouthData*0.8));
        
        //Draw Ears
        ctx.drawImage(ears, 300, 50);
        ctx.drawImage(ears, 750, 50);
        
        //Draw Nose
        ctx.drawImage(nose, 525, 280);

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