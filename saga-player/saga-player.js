document.addEventListener('DOMContentLoaded', function () {

    const audioElement = document.getElementById('audio-element'); // Hljóðelementið
    const audioSource = document.getElementById('audio-source'); // Hljóðgjafinn
    const playBtn = document.getElementById('play-btn'); // Play takkinn
    const pauseBtn = document.getElementById('pause-btn'); // Pause takkinn
    const timeline = document.getElementById('timeline'); // Tímalínan
    const timelineKnob = document.getElementById('timeline-knob'); // Tímalínu skífan
    const progressBar = document.getElementById('progress-bar'); // Svarta línan í tímalínunni
    const volumeBar = document.getElementById('volume-bar'); // Hljóðstyrkslínan
    const volumeKnob = document.getElementById('volume-knob'); // Hljóðstyrks skífan
    const volumeFill = document.getElementById('volume-fill'); // Svarta stikan sem fyllist
    const volumeBtn = document.getElementById('volume-btn'); // Volume hnappur
    const muteBtn = document.getElementById('mute-btn'); // Mute hnappur
    const timeElapsed = document.getElementById('time-elapsed'); // Element sem sýnir liðinn tíma
    const slashTime = document.getElementById('slash-time'); // Element sem sýnir liðinn tíma
    const displayTitle = document.getElementById('displaying-title'); // Element sem sýnir annað hvort beina útsendingu eða nafnþáttar
    const timeTotal = document.getElementById('time-total'); // Element sem sýnir heildartíma hljóðsins
    const bufferBar = document.getElementById('buffer-bar');
    const liveStreamButton = document.getElementById('live-stream-button');
    const displayImage = document.querySelector('.episode-image img');
    let isPlaying = false; // Til að fylgjast með hvort spilarinn sé að spila
    let savedTitle = localStorage.getItem('episodeTitle') || 'Útvarp Saga';  // Sækir þáttatitil eða setur 'Unknown Episode' sem fallback
    const logoUrl = 'https://utvarpsaga.is/wp-content/uploads/2024/11/logo_utvarp_saga_blar_bakgrunnur.png';

    displayTitle.textContent = savedTitle || 'Útvarp Saga'
    const liveStreamUrl = 'https://stream.utvarpsaga.is/Hljodver'; // URL fyrir beina útsendingu
    let isLiveStream = audioSource.src === liveStreamUrl;  // Breyta sem ákvarðar hvort þetta er bein útsending eða upptaka
    let liveStreamStart = new Date(); // Upphafstími þáttarins (UTC)

    let isDragging = false;
    let isDraggingVolume = false;

    // Gæti verið hjálplegt að bæta þessu við til að tryggja að displayImage sé áfram sýnilegt
    displayImage.addEventListener('load', function () {
        displayImage.style.display = 'block';
    });

    // Fjarlægja ákveðin gögn sem gætu valdið vandræðum
    localStorage.removeItem('buttonId');
    localStorage.removeItem('episodeTitle');
    localStorage.removeItem('audioUrl');
    localStorage.removeItem('imageUrl');
    localStorage.removeItem('playerTime');
    localStorage.removeItem('isPlaying');
    localStorage.removeItem('isLiveStream');
    const episodeDuration = 3600
    const volumeAt15dB = 0.1779;
    const maxVolumeHeight = 87; // Heildarhæð hljóðstyrkssvæðis
    window.addEventListener('resize', adjustViewBox);  // Endurhlaða við resize
    adjustViewBox(); // Keyra við upphaf
    window.pauseSagaPlayer = pauseSagaPlayer;
    window.playAudioInSagaPlayer = playAudioInSagaPlayer;
    window.setEpisodeMode = setEpisodeMode;
    window.setLiveStreamMode = setLiveStreamMode;
    window.updateLiveButtonAnimation = updateLiveButtonAnimation;
    window.startPlayback = startPlayback;

    updateDisplayImage()

    // Viðburður til að fylgjast með breytingum í localStorage
    window.addEventListener('storage', function (event) {
        if (event.key === 'activePlayer' && event.newValue !== window.name) {
            // Ef annar flipi er orðinn active, setjum okkar spilara á pásu
            console.log("Annar flipi er nú virkur, stilli þennan á pásu.");
            pauseSagaPlayer(); // kalla á fall til að setja spilarann á pásu
        }
    });


    // Setja upp event listener fyrir bein útsending hnappinn
    document.getElementById('live-stream-button').addEventListener('click', function () {

        // Endurstilla ástand
        isLiveStream = true;
        localStorage.setItem('isLiveStream', 'true');
        localStorage.setItem('episodeTitle', 'Bein útsending');
        localStorage.setItem('audioUrl', liveStreamUrl);

        // Uppfæra DOM
        displayTitle.textContent = 'Bein útsending';
        displayImage.src = logoUrl;
        // Breyta hnappinum í þáttaraðir yfir í "play" einu sinni
        const previousButtonId = localStorage.getItem('buttonId');
        if (previousButtonId) {
            const pauseEvent = new CustomEvent('playerPaused', { detail: { buttonId: previousButtonId } });
            document.dispatchEvent(pauseEvent);
        }
        // Núllstillum buttonId þannig að það sé ekki lengur tengt við þáttaraðir
        localStorage.removeItem('buttonId');

        // Uppfæra hljóðgjafa fyrir lifandi útsendingu
        if (audioSource.src !== liveStreamUrl) {
            audioSource.src = liveStreamUrl;
            audioElement.load();
        }

        // Byrja spilun strax
        audioElement.play().then(() => {
            console.log('Spilun byrjar strax');

            //updateLiveButtonAnimation(); // Animation
        }).catch((error) => {
            console.error('Ekki tókst að spila hljóð:', error);
        });

        if (audioElement.readyState < 2) { // Hljóð ekki tilbúið
            console.log('Bíð eftir að hljóð hleðst...');
            audioElement.addEventListener('canplay', () => {
                startPlayback();
                setLiveStreamMode(); // Uppfærir DOM, tímalínu og animation
            }, { once: true });
        } else {
            startPlayback();
            setLiveStreamMode(); // Uppfærir DOM, tímalínu og animation
        }
    });


    // Volume function
    volumeBtn.addEventListener('click', () => {
        muteButtonVisible();
        const newXPos = 0; // Full hæð samsvarar 0% hljóðstyrk (botninn)
        moveVolumeKnob(newXPos); // Kalla á moveVolumeKnob með yPos fyrir 0 hljóðstyrk
    });


    muteBtn.addEventListener('click', () => {
        volumeButtonVisible();
        audioElement.volume = volumeAt15dB;
        const newXPos = 87 * volumeAt15dB; // Reiknar x-staðsetningu fyrir 15 dB
        moveVolumeKnob(newXPos);
        console.log("Hljóðstyrkur stilltur í 15 dB");
    });


    const event = new CustomEvent('updateStreamStatus', {
        detail: { isLiveStream: audioSource.src === liveStreamUrl }
    });
    window.dispatchEvent(event);


    // Teljarinn skal ekki byrja þegar ekkert er að spilast
    audioElement.addEventListener('ended', () => {
        timeElapsed.textContent = "00:00"; // Nær aftur í 0 þegar hljóðið endar
    });


    // Smellur á hljóðstyrkslínuna
    volumeBar.addEventListener("click", (event) => {
        const rect = volumeBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        moveVolumeKnob(clickX);
    });


    // Drag-fall fyrir mús á hljóðstyrk
    volumeKnob.addEventListener("mousedown", () => {
        isDraggingVolume = true;
    });


    document.addEventListener("mousemove", (event) => {
        if (isDraggingVolume) {
            const rect = volumeBar.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            moveVolumeKnob(mouseX);
        }
    });


    document.addEventListener("mouseup", () => {
        isDraggingVolume = false;
    });


    // Flytur spilarann í body til að tryggja að hann viðhaldist milli síðuhleðslna
    window.addEventListener('beforeunload', function () {
        const audioElement = document.getElementById('audio-element');
        if (audioElement) {
            document.body.appendChild(audioElement);
        }

        const currentActivePlayer = localStorage.getItem('activePlayer');
        if (currentActivePlayer === window.name) {
            localStorage.removeItem('activePlayer');
        }
    });


    window.addEventListener('beforeunload', () => {
        try {
            const audioElement = document.getElementById('audio-element');
            const displayTitle = document.getElementById('displaying-title');
            const displayImage = document.querySelector('.episode-image img');

            localStorage.setItem('playerTime', audioElement.currentTime);
            localStorage.setItem('isPlaying', !audioElement.paused);
            localStorage.setItem('playerVolume', audioElement.volume);
            localStorage.setItem('displayTitle', displayTitle.textContent);
            localStorage.setItem('audioSource', audioElement.src);
            localStorage.setItem('isLiveStream', isLiveStream);
            localStorage.setItem('liveStreamUrl', liveStreamUrl);
            localStorage.setItem('imageUrl', displayImage.src);

            if (!isLiveStream && !isNaN(audioElement.duration)) {
                localStorage.setItem('timelineProgress', (audioElement.currentTime / audioElement.duration) * 100);
            }

            if (!isPlaying) {
                localStorage.setItem('slashTime', slashTime);
                localStorage.setItem('timeTotal', timeTotal);

            }
        } catch (e) {
            console.error('Error storing in localStorage:', e);
        }
    });


    // Hlaða stöðu spilarans þegar síðan opnast aftur
    window.addEventListener('load', () => {
        try {
            const audioElement = document.getElementById('audio-element');
            const displayTitle = document.getElementById('displaying-title');
            const displayImage = document.querySelector('.episode-image img');

            const savedImageUrl = localStorage.getItem('imageUrl') || logoUrl;
            const savedTime = localStorage.getItem('playerTime');
            const wasPlaying = localStorage.getItem('isPlaying') === 'true';
            const savedVolume = localStorage.getItem('playerVolume');
            const savedTitle = localStorage.getItem('episodeTitle') || 'Útvarp Saga';
            const savedAudioUrl = localStorage.getItem('audioSource');
            const isLiveStream = localStorage.getItem('isLiveStream') === 'true';
            let loadSlashDisplay = localStorage.getItem('slashTime');
            let loadTimeTotal = localStorage.getItem('timeTotal');

            // Setja upp titil og mynd
            displayTitle.textContent = isLiveStream ? 'Bein útsending' : savedTitle;
            displayImage.src = savedImageUrl;
            audioElement.volume = savedVolume && !isNaN(savedVolume) ? parseFloat(savedVolume) : volumeAt15dB;

            if (!wasPlaying) {
                loadSlashDisplay = ''
                loadTimeTotal = '00:00'
            }
            if (isLiveStream) {
                // Byrja á beinni útsendingu
                audioElement.src = liveStreamUrl;
                displayTitle.textContent = 'Bein útsending';
                displayImage.src = logoUrl;

                setLiveStreamMode();
                audioElement.addEventListener('timeupdate', updateLiveTimeline);
            } else if (savedAudioUrl) {
                // Byrja á síðasta valda þætti
                audioElement.src = savedAudioUrl;

                if (wasPlaying) {
                    audioElement.play().then(() => {
                        isPlaying = true;
                        pauseButtonVisible();
                    }).catch((error) => {
                        console.warn('Sjálfvirk spilun ekki leyfð:', error);
                    });
                }
            }
        } catch (e) {
            console.error('Villa við að hlaða gögn úr localStorage:', e);
        }
    });


    // Smellur á tímalínuna
    timeline.addEventListener("click", (event) => {

        if (!isLiveStream || (isLiveStream && audioElement.buffered.length > 0)) {
            const rect = timeline.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            moveKnob(clickX);
        }
    });


    timeline.addEventListener("touchstart", (event) => {
        if (!isLiveStream || (isLiveStream && audioElement.buffered.length > 0)) {
            const rect = timeline.getBoundingClientRect();
            const touchX = event.touches[0].clientX - rect.left;
            moveKnob(touchX);
        }
    });


    // Drag-fall fyrir mús á tímalínu
    timelineKnob.addEventListener("mousedown", () => {
        if (isLiveStream) {
            const buffered = audioElement.buffered;
            if (buffered.length > 0) {
                isDragging = true; // Allow dragging if there’s cached content
            }
        } else {
            isDragging = true; // Allow dragging in non-live mode
        }
    });



    timelineKnob.addEventListener("touchstart", (event) => {
        if (isLiveStream) {
            const buffered = audioElement.buffered;
            if (buffered.length > 0) {
                isDragging = true; // Leyfa drögun ef það er buffer
            }
        } else {
            isDragging = true; // Leyfa drögun í upptökuham
        }
        event.preventDefault(); // Hindra að vafri sjái þetta sem scrolling
    });



    document.addEventListener("mousemove", (event) => {
        if (isDragging) {
            const rect = timeline.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            moveKnob(mouseX);
        }
    });



    document.addEventListener("touchmove", (event) => {
        if (isDragging) {
            const rect = timeline.getBoundingClientRect();
            const touchX = event.touches[0].clientX - rect.left;
            moveKnob(touchX);
        }
        event.preventDefault(); // Hindra að vafri skrolli meðan á drögun stendur
    });



    document.addEventListener("mouseup", () => {
        isDragging = false;
    });


    document.addEventListener("touchend", () => {
        isDragging = false;
    });


    // Kalla á fallið við hleðslu síðunnar
    window.onload = adjustViewBox;

    // Endurkalla fallið þegar gluggastærð breytist
    window.onresize = adjustViewBox;
    audioElement.addEventListener('timeupdate', () => {
        if (!isNaN(audioElement.duration) && audioElement.duration > 0) {
            const timelineWidth = timeline.getBoundingClientRect().width; // Fá breidd tímalínunnar
            const progress = (audioElement.currentTime / audioElement.duration) * timelineWidth; // Reikna hlutfallslega framvindu
            progressBar.setAttribute('width', progress); // Uppfæra breidd framvindustikunnar (progressBar)
            timelineKnob.setAttribute('cx', progress); // Uppfæra stöðu skífunnar (timelineKnob)
            updateTimeDisplay(); // Uppfæra texta fyrir tímann ef til staðar
        }
    });


    // Play function með betri hleðslustjórnun
    playBtn.addEventListener('click', () => {
        if (!isPlaying) {
            isLiveStream = audioSource.src === liveStreamUrl;
            // Byrja spilun strax
            audioElement.play().then(() => {
                console.log('Spilun byrjar strax');
            }).catch((error) => {
                console.error('Ekki tókst að spila hljóð:', error);
            });

            if (audioElement.readyState < 3) {
                console.log('Bíð eftir að hljóð hleðst...');
                audioElement.addEventListener('canplay', () => {
                    startPlayback();
                });
            } else {
                startPlayback();
            }
        }
    });


    // Pause function
    pauseBtn.addEventListener('click', () => {
        if (audioElement) {
            pauseSagaPlayer();  // Make sure Saga Player is paused too
        }
    });


    if (audioSource.src !== liveStreamUrl) {
        audioSource.src = liveStreamUrl;
        audioElement.load(); // Hlaða aðeins ef slóðin hefur breyst
    }


    function updateTimeDisplay() {
        const currentTime = formatTime(audioElement.currentTime || 0);
        const totalTime = (!isNaN(audioElement.duration) && audioElement.duration > 0)
            ? formatTime(audioElement.duration)
            : "00:00"; // Sjálfgefið gildi ef duration er ekki tiltækt
        if (!isLiveStream) {  // Ef þáttur er í spilun
            timeElapsed.textContent = currentTime;
            slashTime.textContent = " / ";
            timeTotal.textContent = totalTime;
            slashTime.style.display = "block";
            timeTotal.style.display = "block";
        } else if (isLiveStream) {  // Ef það er bein útsending
            timeElapsed.textContent = currentTime;
            slashTime.style.display = "none";
            timeTotal.style.display = "none";
        } else if (!isPlaying) {  // Ef ekkert er í spilun
            timeElapsed.textContent = "00:00";
            slashTime.textContent = " / ";
            timeTotal.textContent = "00:00";
            slashTime.style.display = "block";
            timeTotal.style.display = "block";
        } else {
            slashTime.style.display = "none";
            timeTotal.style.display = "none";
            timeElapsed.style.display = "none";
        }
    }


    function updateDisplayImage() {
        const isLiveStream = localStorage.getItem('isLiveStream') === 'true';
        const displayImage = document.querySelector('.episode-image img');

        if (isLiveStream) {
            // Set to live stream logo
            displayImage.src = 'https://wordpress-1000093-3520884.cloudwaysapps.com/wp-content/uploads/2024/10/logo_utvarp_saga_blar_bakgrunnur.png';
            displayImage.alt = 'Bein útsending';
        } else if (!isLiveStream) {
            // Set to episode image
            displayImage.src = localStorage.getItem('imageUrl');
            displayImage.alt = localStorage.getItem('episodeTitle');
        } else {
            // Set default image if no episode is selected and not live streaming
            displayImage.src = 'https://wordpress-1000093-3520884.cloudwaysapps.com/wp-content/uploads/2024/10/logo_utvarp_saga_blar_bakgrunnur.png' // Path to a default image
            displayImage.alt = 'Engin þáttur í spilun';
        }
    }


    function adjustViewBox() {
        var width = window.innerWidth;
        var svg = document.getElementById('timeline');

        if (width <= 320) {  // Mjög þröngir skjár
            svg.setAttribute('viewBox', '0 0 320 12');
        } else if (width <= 360) {  // Smá símar
            svg.setAttribute('viewBox', '0 0 360 12');
        } else if (width <= 375) {  // Smá símar
            svg.setAttribute('viewBox', '0 0 375 12');
        } else if (width <= 390) {  // Smá símar
            svg.setAttribute('viewBox', '0 0 390 12');
        } else if (width <= 412) {  // Smá símar
            svg.setAttribute('viewBox', '0 0 412 12');
        } else if (width <= 414) {  // Smá símar
            svg.setAttribute('viewBox', '0 0 414 12');
        } else if (width <= 430) {  // Smá símar
            svg.setAttribute('viewBox', '0 0 430 12');
        } else if (width <= 480) {  // Smá símar
            svg.setAttribute('viewBox', '0 0 480 12');
        } else if (width <= 768) {  // Spjaldtölvur
            svg.setAttribute('viewBox', '0 0 768 12');
        } else if (width <= 820) {
            svg.setAttribute('viewBox', '0 0 820 12');
        } else {  // Stærri skjáir
            svg.setAttribute('viewBox', '0 0 729 12');
        }

    }


    function playButtonVisible() {
        playBtn.style.display = 'block';
        pauseBtn.style.display = 'none';
    }


    function pauseButtonVisible() {
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'block';
    }


    function pauseSagaPlayer(audioUrl = null) {
        //const audio = document.getElementById('audio-element');
        if (!audioUrl) {
            audioUrl = localStorage.getItem('audioSource') || ''; // Setur það ef það er geymt
        }

        if (audioElement) {
            audioElement.pause();
            isPlaying = false;
            localStorage.setItem('isPlaying', 'false');
            playButtonVisible();

            if (!buttonId) {
                buttonId = localStorage.getItem('buttonId'); // Sækir úr localStorage ef það er ekki global
            }

            if (buttonId) {
                const pauseEvent = new CustomEvent('playerPaused', { detail: { buttonId, audioUrl } });
                document.dispatchEvent(pauseEvent);
            } else {
                console.warn("buttonId fannst ekki í localStorage við sendingu á playerPaused.");
            }
        }
    }


    function playAudioInSagaPlayer(audioUrl, episodeTitle, newButtonId, imageUrl) {
        console.log("Playing audio:", audioUrl);

        if (audioSource && audioElement) {
            // Stöðva núverandi spilun
            if (!audioElement.paused || isPlaying) {
                console.log("Stöðva núverandi spilun");
                pauseSagaPlayer();
            }

            audioElement.removeEventListener('timeupdate', updateRecordingTimeline);
            audioElement.removeEventListener('timeupdate', updateLiveTimeline);

            buttonId = localStorage.getItem('buttonId') || newButtonId;

            // Uppfæra audioSource og hlaða rétt audio
            if (audioSource.src !== audioUrl) {
                audioSource.src = audioUrl;
                audioElement.load();
            }

            isLiveStream = audioUrl === liveStreamUrl; // Athuga hvort þetta sé bein útsending eða þáttur
            localStorage.setItem('isLiveStream', isLiveStream);

            // Uppfæra DOM
            displayTitle.textContent = episodeTitle || 'Unknown Episode';
            displayImage.src = isLiveStream ? logoUrl : (imageUrl || logoUrl); // Setja logo ef þetta er bein útsending

            checkAndAnimateTitle(); // Keyra animation ef titillinn er of langur
            startPlayback();
        } else {
            console.error("Audio element or source not found!");
        }
    }


    function startPlayback(audioUrl = null, episodeTitle) {
        // Sækja episodeTitle úr localStorage
        console.log('Sóttur episodeTitle:', savedTitle);  // Skoða hvað er sótt
        displayTitle.textContent = savedTitle;  // Update the title from saved data
        const liveStreamButton = document.querySelector('.live-stream-btn');

        if (audioUrl !== null && audioSource.src !== audioUrl) {
            audioSource.src = audioUrl;
            audioElement.load();  // Hlaða hljóð á ný ef slóðin hefur breyst
        }
        localStorage.setItem('isPlaying', 'true');
        audioElement.play().then(() => {
            console.log('Spilarinn byrjaði.');
            //isPlaying = true;
            pauseButtonVisible();

            if (isLiveStream) {
                console.log('Setja upp beina útsendingu');
                //updateLiveButtonAnimation();
                setLiveStreamMode();  // Virkja tímalínu fyrir lifandi straum
                audioElement.addEventListener('timeupdate', updateLiveTimeline); // Uppfæra tímalínu fyrir lifandi straum
            } else if (audioUrl) {
                liveStreamButton.classList.remove('live-animation');
                startPlayer(audioUrl, episodeTitle, localStorage.getItem('buttonId'));  // Uppfæra með valinni hljóðslóð og nafn þáttarins
            } else {
                console.log('Setja upp upptöku');
                liveStreamButton.classList.remove('live-animation');
                audioElement.addEventListener('timeupdate', updateRecordingTimeline); // Uppfæra tímalínu fyrir upptökur
            }
            checkAndAnimateTitle();
            const playEvent = new CustomEvent('playerStarted', {
                detail: { audioUrl, episodeTitle, buttonId }
            });
            document.dispatchEvent(playEvent);  // Trigger the event to notify that playback has started
        }).catch((error) => {
            console.error('Spilun mistókst:', error);
        });
    }


    // Stillum activePlayer þegar spilun hefst
    function startPlayer(audioUrl, episodeTitle, buttonId) {
        // Athugum hvort annar flipi sé með activePlayer flaggið
        const currentActivePlayer = localStorage.getItem('activePlayer');
        if (currentActivePlayer && currentActivePlayer !== window.name) {
            console.log("Annar flipi er nú þegar með virkan spilara.");
            return;
        }

        // Setja þennan flipa sem active player
        localStorage.setItem('activePlayer', window.name); // nota window.name til að auðkenna flipann
        playAudioInSagaPlayer(audioUrl, episodeTitle, buttonId, localStorage.getItem('imageUrl'));
    }


    // Virkja animation þegar bein útsending er í gangi
    function updateLiveButtonAnimation() {
        if (isLiveStream) {
            liveStreamButton.classList.add('live-animation');
        } else {
            liveStreamButton.classList.remove('live-animation');
        }
    }


    function checkAndAnimateTitle() {

        const displayTitle = document.getElementById('displaying-title');
        const displayTitleContainer = document.querySelector('.display-title');

        if (!displayTitle || !displayTitleContainer) {
            console.warn("displayTitle or displayTitleContainer not found");
            return;
        }
        // Athuga hvort textinn fari yfir max-width gildi
        if (displayTitle.scrollWidth > displayTitleContainer.clientWidth) {
            displayTitle.style.animation = 'scroll-left 20s linear infinite';
        } else {
            displayTitle.style.animation = 'none';
        }
    }


    // Uppfæra tímalínuna fyrir lifandi straum
    function updateLiveTimeline() {
        const now = new Date();  // Núverandi tími
        let elapsedTime = (now - liveStreamStart) / 1000;  // Liðinn tími frá byrjun útsendingar

        const timelineWidth = timeline.getBBox().width;  // Fá breiddina á tímalínunni í SVG
        const knobWidth = timelineKnob.getBBox().width;  // Fá breiddina á skífunni

        const buffered = audioElement.buffered;
        if (buffered.length > 0) {
            const bufferEnd = buffered.end(buffered.length - 1);
            const totalDuration = (now - liveStreamStart) / 1000;
            const cachedDuration = Math.min(bufferEnd, totalDuration);
            // Reikna framvinduna og uppfæra breidd framvindustikunnar
            const progress = (cachedDuration / totalDuration) * timelineWidth;
            progressBar.setAttribute('width', progress);  // Uppfæra breidd framvindustikunnar í SVG
            // Setja stöðu skífunnar í SVG
            timelineKnob.setAttribute('cx', progress);  // Uppfæra stöðu skífunnar
        } else {
            // Ef ekkert er hlaðið, setja framvindustikuna í fulla breidd
            progressBar.setAttribute('width', timelineWidth);  // Setja breidd í SVG
            timelineKnob.setAttribute('cx', timelineWidth - knobWidth / 2);  // Setja stöðu skífunnar lengst til hægri
        }
        updateTimeDisplay();
        checkAndAnimateTitle();  // Athugar hvort animation á að virkjast
    }


    function setLiveStreamMode() {
        const liveStreamUrl = 'https://stream.utvarpsaga.is/Hljodver';
        const logoUrl = 'https://wordpress-1000093-3520884.cloudwaysapps.com/wp-content/uploads/2024/10/logo_utvarp_saga_blar_bakgrunnur.png';

        // Uppfæra global breytur
        isLiveStream = true;
        audioSource.src = liveStreamUrl;
        localStorage.setItem('isLiveStream', 'true');
        localStorage.setItem('episodeTitle', 'Bein útsending');

        // Uppfæra DOM
        displayImage.src = logoUrl;
        displayTitle.textContent = 'Bein útsending';
        // Uppfæra viðburðastýringar
        audioElement.removeEventListener('timeupdate', updateRecordingTimeline);
        audioElement.addEventListener('timeupdate', updateLiveTimeline);
    }


    function setEpisodeMode(audioUrl, episodeTitle, imageUrl, buttonId) {
        isLiveStream = false;
        audioSource.src = audioUrl;
        localStorage.setItem('isLiveStream', 'false');
        localStorage.setItem('episodeTitle', episodeTitle);
        localStorage.setItem('imageUrl', imageUrl);
        localStorage.setItem('buttonId', buttonId);

        // Uppfæra DOM
        displayImage.src = imageUrl;
        displayTitle.textContent = episodeTitle;
        updateTimeDisplay();
        // Uppfæra viðburðastýringar
        audioElement.removeEventListener('timeupdate', updateLiveTimeline);
        audioElement.addEventListener('timeupdate', updateRecordingTimeline);
    }


    // Uppfæra tímalínuna fyrir upptökur
    function updateRecordingTimeline() {
        const timelineWidth = timeline.getBBox().width;  // Notum `getBBox()` til að fá breidd tímalínunnar í SVG
        const progress = (audioElement.currentTime / audioElement.duration) * timelineWidth;  // Reiknar hlutfallslega framvindu
        // Uppfærir framvindustikuna (progressBar) með því að stilla `width`
        progressBar.setAttribute('width', progress);  // Stillir breidd framvindustikunnar

        // Uppfærir stöðu skífunnar (timelineKnob) með því að stilla `cx` (fyrir `circle`)
        timelineKnob.setAttribute('cx', progress);  // Stillir x-staðsetningu skífunnar í SVG

        // Sækjum titilinn úr localStorage ef episodeTitle er ekki skilgreind
        const savedEpisodeTitle = localStorage.getItem('episodeTitle') || 'Unknown Episode';
        buttonId = localStorage.getItem('buttonId')// || 'default-button-id';  // Bæta við buttonId
        displayTitle.textContent = savedEpisodeTitle;
        updateTimeDisplay();
        checkAndAnimateTitle();  // Athugar hvort animation á að virkjast
    }


    // Færa skífuna á tímalínu
    function moveKnob(xPos) {
        const rect = timeline.getBBox();  // Fá stærð tímalínunnar í SVG
        const minX = 6.5;  // Minimum x-position (for the knob)
        const maxX = rect.width - 6.5;  // Maximum x-position (for the knob)

        let newX = Math.max(minX, Math.min(maxX, xPos));  // Reikna nýa x-position, til að fullvissa það haldist innan min/max


        timelineKnob.setAttribute('cx', newX); // Move the knob by updating the 'cx' attribute of the circle

        // Adjust the width of the progress bar by updating the 'width' attribute of the rect
        progressBar.setAttribute('width', newX);

        if (isLiveStream) {
            // Handle live stream time updates here (similar to before)
            const buffered = audioElement.buffered;
            if (buffered.length > 0) {
                const bufferEnd = buffered.end(buffered.length - 1);
                const totalDuration = (new Date() - liveStreamStart) / 1000;
                const seekableEnd = Math.min(bufferEnd, totalDuration);

                const newTime = (newX / maxX) * seekableEnd;
                if (newTime <= bufferEnd) {
                    audioElement.currentTime = newTime;
                }
            }
        } else {
            // For regular audio playback, update the current time based on knob position
            const newTime = (newX / maxX) * audioElement.duration;
            audioElement.currentTime = newTime;
        }
    }


    // Fall til að formatta tíma í mínútur og sekúndur
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }


    // Færa skífuna fyrir hljóðstyrk
    function moveVolumeKnob(xPos) {
        const minX = 2; // Lágmarks x-staða (0% hljóðstyrkur)
        const maxX = 87; // Hámarks x-staða (100% hljóðstyrkur)
        let newX = Math.max(minX, Math.min(maxX, xPos));

        // Uppfæra stöðu skífunnar og fyllingu
        volumeKnob.setAttribute("cx", newX); // Færir skífuna í rétta x-stöðu
        volumeFill.setAttribute("width", newX); // Stillir breidd fyllingar frá vinstri

        // Setja hljóðstyrk (0 til 1) miðað við x-staða
        const volumeLevel = (newX - minX) / (maxX - minX);
        audioElement.volume = volumeLevel;
        console.log("Hljóðstyrkur:", volumeLevel);

        if (volumeLevel <= 0) {
            muteButtonVisible();
        } else {
            volumeButtonVisible();
        }
    }


    function volumeButtonVisible() {
        muteBtn.style.display = 'none';
        volumeBtn.style.display = 'block';
    }


    function muteButtonVisible() {
        volumeBtn.style.display = 'none'; // Felur hljóðstyrkshnappinn
        muteBtn.style.display = 'block'; // Sýnir mute hnappinn
    }
});