document.addEventListener('DOMContentLoaded', function () {

    const audioElement = document.getElementById('audio-element'); // Hljóðelementið
    //const audioSourceElement = document.getElementById('audio-source'); // Hljóðgjafinn
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
    let episodeTitle = localStorage.getItem('episodeTitle') || 'Smelltu á hnappinn hér til hægri fyrir beina útsendingu';  // Sækir þáttatitil eða setur 'Unknown Episode' sem fallback
    audioElement.preload = 'auto';
    const logoUrl = 'https://wordpress-1000093-3520884.cloudwaysapps.com/wp-content/uploads/2024/10/logo_utvarp_saga_blar_bakgrunnur.png';

    displayTitle.textContent = episodeTitle || 'Smelltu á spila til að hlusta í beinni'
    const liveStreamUrl = 'https://stream.utvarpsaga.is/Hljodver'; // URL fyrir beina útsendingu
    let isLiveStream = audioElement.src === liveStreamUrl;  // Breyta sem ákvarðar hvort þetta er bein útsending eða upptaka
    let liveStreamStart = new Date(); // Upphafstími þáttarins (UTC)

    let buttonId = '';  // Declare currentButtonId globally
    let isDragging = false;
    let isDraggingVolume = false;
    let imageUrl = ''; // Fjarlægðu eina skilgreiningu eða notaðu einungis let imageUrl einu sinni


    // Setur logo þegar síðan hleðst ef ekkert er í spilun
    displayImage.src = localStorage.getItem('imageUrl') || logoUrl;
    displayImage.style.display = 'block';

    // Gæti verið hjálplegt að bæta þessu við til að tryggja að displayImage sé áfram sýnilegt
    displayImage.addEventListener('load', function () {
        displayImage.style.display = 'block';
    });


    const episodeDuration = 3600
    const volumeAt15dB = 0.1779;
    const maxVolumeHeight = 87; // Heildarhæð hljóðstyrkssvæðis
    console.log("hvað keyrist hér")
    // Endurhlaða við resize
    window.addEventListener('resize', adjustViewBox);
    adjustViewBox(); // Keyra við upphaf
    window.pauseAudio = pauseAudio;
    // Kalla á fallið við hleðslu síðunnar
    window.onload = adjustViewBox;
    // Endurkalla fallið þegar gluggastærð breytist
    window.onresize = adjustViewBox;
    window.startPlayback = startPlayback;


    /*
    if (audioElement.src !== liveStreamUrl) {
        audioElement.src = liveStreamUrl;
        audioElement.load(); // Hlaða aðeins ef slóðin hefur breyst
    }*/

    // Viðburður til að fylgjast með breytingum í localStorage
    window.addEventListener('beforeunload', function () {
        const currentActivePlayer = localStorage.getItem('activePlayer');
        if (currentActivePlayer === window.name) {
            // Setja flag til að láta vita að flipi er að hætta
            localStorage.setItem('playerClosed', window.name);
        }
    });


    // Stillum activePlayer þegar spilun hefst
    function startPlayer(audioUrl, episodeTitle, buttonId, imageUrl, isLiveStream) {
        const currentActivePlayer = localStorage.getItem('activePlayer');
        if (currentActivePlayer && currentActivePlayer !== window.name) {
            const lastActiveTime = parseInt(localStorage.getItem('activePlayerTime')) || 0;
            const now = Date.now();
            const heartbeatInterval = 3000; // 3 sekúndur

            // Ef enginn heartbeat frá activePlayer hefur komið fram síðustu 3 sekúndur, tökum við við stjórn
            if (now - lastActiveTime > heartbeatInterval) {
                console.log("Yfirtekur spilarann þar sem fyrri flipi er ekki virkur lengur.");
                localStorage.setItem('activePlayer', window.name);
                localStorage.setItem('activePlayerTime', now);
            } else {
                console.log("Annar flipi er nú þegar virkur.");
                return; // Ef fyrri flipi er virkur, gerum ekkert frekar
            }
        } else {
            localStorage.setItem('activePlayer', window.name);
            localStorage.setItem('activePlayerTime', Date.now());
        }

        startPlayback(audioUrl, episodeTitle, buttonId, imageUrl, isLiveStream);
    }



    document.getElementById('live-stream-button').addEventListener('click', function () {
        const imageUrl = logoUrl; // Stillir myndina á logoUrl fyrir beina útsendingu

        // Setja isLiveStream sem true í localStorage og breyta display title
        localStorage.setItem('isLiveStream', true);
        localStorage.setItem('episodeTitle', 'Bein útsending');
        localStorage.removeItem('audioUrl'); // Fjarlægir þáttaslóðina
        localStorage.setItem('imageUrl', imageUrl);

        // Kalla á updateTimetotal með isLiveStream stillt á true
        updateTimetotal(true, timeElapsed, slashTime, timeTotal);

        // Búa til og senda pause og play events til að uppfæra hnappa í þáttaraðir
        const previousButtonId = localStorage.getItem('buttonId');
        if (previousButtonId) {
            dispatchPlayerEvents('pause', previousButtonId);
        }

        // Núllstillum buttonId þannig að það sé ekki lengur tengt við þáttaraðir
        localStorage.removeItem('buttonId');
        // Kalla á startPlayer fyrir bein útsending
        startPlayer(liveStreamUrl, 'Bein útsending', 'live-stream-button');
    });


    const event = new CustomEvent('updateStreamStatus', {
        detail: { isLiveStream: audioElement.src === liveStreamUrl }
    });
    window.dispatchEvent(event);


    // Play function með betri hleðslustjórnun
    playBtn.addEventListener('click', () => {
        const audioUrl = localStorage.getItem('audioUrl') || liveStreamUrl; // Nota liveStreamUrl ef audioUrl er ekki skilgreind
        const episodeTitle = localStorage.getItem('episodeTitle') || 'Bein útsending'; // Sjálfgefið heiti ef ekkert annað er
        const buttonId = localStorage.getItem('buttonId') || 'playBtn'; // Sjálfgefið buttonId ef það vantar
        const imageUrl = localStorage.getItem('imageUrl') || logoUrl; // Nota logoUrl ef ekkert annað er til staðar

        startPlayback(audioUrl, episodeTitle, buttonId, imageUrl);
    });


    function adjustViewBox() {
        var width = window.innerWidth;
        var svg = document.getElementById('timeline');

        if (width <= 320) {  // Mjög þröngir skjár
            svg.setAttribute('viewBox', '0 0 320 12');
        } else if (width <= 480) {  // Smá símar
            svg.setAttribute('viewBox', '0 0 480 12');
        } else if (width <= 768) {  // Spjaldtölvur
            svg.setAttribute('viewBox', '0 0 768 12');
        } else {  // Stærri skjáir
            svg.setAttribute('viewBox', '0 0 729 12');
        }
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
            console.log("Title is too long, enabling animation");
            displayTitle.style.animation = 'scroll-left 20s linear infinite';
        } else {
            console.log("Title fits within container, no animation needed");
            displayTitle.style.animation = 'none';
        }
    }


    // Uppfæra displayTitle og athuga animation
    function updateDisplayTitle(isLiveStream, episodeTitle) {
        const displayTitle = document.getElementById('displaying-title');

        if (isLiveStream) {
            displayTitle.textContent = 'Bein útsending';
        } else {
            displayTitle.textContent = episodeTitle;
        }

        // Kalla á fallið til að athuga hvort animation eigi að byrja
        checkAndAnimateTitle();
    }


    // Uppfæra displayTitle og athuga animation
    function updateTimetotal(isLiveStream, timeElapsed, slashTime, timeTotal) {

        if (isLiveStream) {
            const currentTime = formatTime(audioElement.currentTime);
            timeElapsed.textContent = currentTime;
            timeTotal.textContent = ""; // Felur heildartíma fyrir beina útsendingu
            slashTime.textContent = ""; // Felur skástrikið
            timeTotal.style.display = "none";
            slashTime.style.display = "none";
        } else {
            const currentTime = formatTime(audioElement.currentTime);
            const totalTime = !isNaN(audioElement.duration) ? formatTime(audioElement.duration) : "00:00";
            timeElapsed.textContent = currentTime;
            slashTime.textContent = " / ";
            timeTotal.textContent = totalTime;
            timeTotal.style.display = "inline";
            slashTime.style.display = "inline";
        }
    }



    // Pause function
    pauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            audioElement.pause();
            isPlaying = false;
            playButtonVisible();
            // Call pauseAudio with buttonId
            pauseAudio();  // You should have currentButtonId defined
        }
    });


    function playButtonVisible() {
        playBtn.style.display = 'block';
        pauseBtn.style.display = 'none';
    }


    function pauseButtonVisible() {
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'block';
    }


    function pauseAudio(audioUrl = null) {
        if (!audioUrl) {
            audioUrl = localStorage.getItem('audioSrc') || ''; // Setur það ef það er geymt
        }

        if (audioElement) {
            audioElement.pause();
            isPlaying = false;
            playButtonVisible();
            dispatchPlayerEvents('pause', buttonId);

        }
    }



    function startPlayback(audioUrl, episodeTitle, buttonId, imageUrl, isLiveStream) {
        if (!audioElement) {
            console.error("Audio element not found!");
            return;
        }


        if (!isPlaying) {
            isLiveStream = audioElement.src === liveStreamUrl;
            // Athuga fyrst hvort audioElement.src þarf að breyta
            if (audioElement.src !== audioUrl) {
                audioElement.src = audioUrl;
            }

            // Uppfæra mynd út frá því hvort það er bein útsending eða þáttur
            const imageToDisplay = isLiveStream ? logoUrl : imageUrl || localStorage.getItem('imageUrl') || logoUrl;
            displayImage.src = imageToDisplay;
            localStorage.setItem('imageUrl', imageToDisplay);

            // Uppfæra titil og vista hann í localStorage ef hann breytist
            updateDisplayTitle(isLiveStream, episodeTitle);
            localStorage.setItem('episodeTitle', episodeTitle);

            // Uppfæra titil og vista hann í localStorage ef hann breytist
            if (isLiveStream) {
                // Tengja viðburð fyrir lifandi streymi
                audioElement.addEventListener('timeupdate', updateLiveTimeline);
            } else {
                updateDisplayTitle(false, episodeTitle);
                // Tengja viðburð fyrir upptöku-tímalínu
                audioElement.addEventListener('timeupdate', updateRecordingTimeline);
            }
            updateLiveButtonAnimation();

            // Fjarlægja fyrri timeupdate atburði til að forðast margfaldan binding
            audioElement.removeEventListener('timeupdate', updateRecordingTimeline);
            audioElement.removeEventListener('timeupdate', updateLiveTimeline);
            if (audioElement.readyState < 3) {
                console.log('Bíð eftir að hljóð hleðst...');
                audioElement.load();
            } else {
                handlePlay();
            }


        }
    }



    function handlePlay() {
        audioElement.play().then(() => {
            console.log('Spilun byrjar strax');
            isPlaying = true;
            pauseButtonVisible();
            dispatchPlayerEvents('play', buttonId, audioElement.src, episodeTitle);
        }).catch((error) => {
            console.error('Ekki tókst að spila hljóð:', error);
        });
    }

    // Flytur spilarann í body til að tryggja að hann viðhaldist milli síðuhleðslna
    window.addEventListener('beforeunload', function () {
        const currentActivePlayer = localStorage.getItem('activePlayer');
        if (currentActivePlayer === window.name) {
            localStorage.removeItem('activePlayer');
        }
    });


    // Villumeðhöndlun við unload
    window.addEventListener('beforeunload', () => {
        try {
            localStorage.setItem('playerTime', audioElement.currentTime);
            localStorage.setItem('isPlaying', !audioElement.paused);
            localStorage.setItem('playerVolume', audioElement.volume);
            localStorage.setItem('displayTitle', displayTitle.textContent);
            localStorage.setItem('audioSrc', audioElement.src);
            localStorage.setItem('isLiveStream', isLiveStream);
            localStorage.setItem('liveStreamUrl', liveStreamUrl);
            if (!isLiveStream && !isNaN(audioElement.duration)) {
                // Store the current time and timeline state if it's not a live stream
                localStorage.setItem('timelineProgress', (audioElement.currentTime / audioElement.duration) * 100);
                localStorage.setItem('episodeTitle', episodeTitle)
                localStorage.setItem('imageUrl', displayImage.src);
            } else if (isLiveStream) {
                localStorage.setItem('episodeTitle', 'Bein útsending')
            } else {
                localStorage.setItem('episodeTitle', 'Útvarp Saga')
            }

            // Store the current audio source in localStorage
            if (audioElement && audioElement.src) {
                localStorage.setItem('audioSrc', audioElement.src);
            }

            // Store player data
        } catch (e) {
            console.error('Error storing in localStorage:', e);
        }
    });


    // Hlaða stöðu spilarans þegar síðan opnast aftur
    window.addEventListener('load', () => {
        try {
            const audioElement = document.getElementById('audio-element');
            const savedImageUrl = localStorage.getItem('imageUrl') || logoUrl;
            const savedTime = localStorage.getItem('playerTime');
            const wasPlaying = localStorage.getItem('isPlaying') === 'true';
            const savedVolume = parseFloat(localStorage.getItem('playerVolume'));
            const savedButtonId = localStorage.getItem('buttonId');
            const savedEpisodeTitle = localStorage.getItem('episodeTitle');
            const savedProgress = localStorage.getItem('timelineProgress');
            const savedAudioUrl = localStorage.getItem('audioUrl');
            const isLiveStream = localStorage.getItem('isLiveStream') === 'true';  // Athuga hvort það var bein útsending
            let volumeLevel = savedVolume || volumeAt15dB;

            if (savedEpisodeTitle) {
                displayTitle.textContent = savedEpisodeTitle;
            }

            displayImage.src = savedImageUrl;
            updateTimetotal(isLiveStream, timeElapsed, slashTime, timeTotal);

            if (savedVolume && !isNaN(savedVolume)) {
                // Hlaða vistaðri hljóðstyrksstöðu
                volumeLevel = savedVolume;
                console.log("Vistaður hljóðstyrkur hlaðinn:", volumeLevel);
            } else {
                // Setja sjálfgefið hljóðstyrk ef ekkert var vistað
                volumeLevel = volumeAt15dB;  // Þú getur stillt volumeAt15dB eða önnur gildi
                console.log("Engin vistaður hljóðstyrkur, nota sjálfgefinn hljóðstyrk:", volumeLevel);
            }

            // Reikna x-staðsetningu byggt á volumeLevel
            const newXPos = 87 * volumeLevel; // Reiknað út frá hámarksbreiddinni (63 px)
            moveVolumeKnob(newXPos);  // Kalla á fall til að uppfæra UI

            // Setja hljóðstyrkinn á spilaranum
            audioElement.volume = volumeLevel;

            if (savedAudioUrl && !isLiveStream) {
                // Endurhlaða upptöku
                audioElement.src = savedAudioUrl;
                audioElement.currentTime = savedTime;
                updateDisplayTitle(false, episodeTitle);
                updateTimetotal(false, timeElapsed, slashTime, timeTotal)
                displayImage.src = savedImageUrl;
                audioElement.load();

                if (savedButtonId) {
                    const button = document.querySelector(`#play-pause-btn-${savedButtonId}`);
                    if (button && wasPlaying) {
                        updatePlayPauseButton(button, true);
                        startPlayback(audioUrl, episodeTitle, buttonId, imageUrl, false);
                    }
                }
            } else if (isLiveStream) {
                // Endurhlaða beina útsendingu
                //til að athuga hvort eigi að sýna heildartíma þáttar eða ekki
                audioElement.src = liveStreamUrl;
                setLiveStreamMode();
                audioElement.addEventListener('timeupdate', updateLiveTimeline);
            }

            if (!isLiveStream && savedTime && !isNaN(savedTime)) {
                audioElement.currentTime = parseFloat(savedTime);
            }

            // Endurhlaða framvindu tímalínunnar
            if (!isLiveStream && savedProgress && !isNaN(savedProgress)) {
                const timelineWidth = timeline.getBBox().width;
                const progress = (parseFloat(savedProgress) / 100) * timelineWidth;
                progressBar.setAttribute('width', progress);
                timelineKnob.setAttribute('cx', progress);
            }

            if (wasPlaying) {
                audioElement.play().then(() => {
                    isPlaying = true;
                    pauseButtonVisible();
                }).catch((error) => {
                    console.warn('Sjálfvirk spilun ekki leyfð:', error);
                });
            }
        } catch (e) {
            console.error('Villa við að hlaða gögn úr localStorage:', e);
        }
    });


    // Uppfæra tímalínuna fyrir lifandi straum
    function updateLiveTimeline() {
        console.log('í beinni er spilað')

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
        //        setLiveStreamMode();
    }


    function updateTimeLineAndKnobWidth() {
        const timelineWidth = timeline.getBBox().width;  // Fá breiddina af tímalínunni í SVG
        // Færa skífuna (knob) lengst til hægri
        const knobWidth = timelineKnob.getBBox().width;  // Fá breidd skífunnar ef þú þarft hana miðjaða
        const newKnobPosition = timelineWidth - knobWidth / 2;  // Reikna nýja staðsetningu fyrir skífuna
        // Uppfærir breidd framvindustikunnar í fulla breidd
        progressBar.setAttribute('width', timelineWidth);  // Notar `setAttribute` til að breyta breidd
        // Uppfæra x-staðsetningu skífunnar (fyrir `circle` notum við `cx`)
        timelineKnob.setAttribute('cx', newKnobPosition);
    }


    // Fall til að reikna lengd lifandi útsendingar miðað við þann tíma sem liðinn er
    function liveStreamDuration() {
        const now = new Date();
        return (now - liveStreamStart) / 1000; // Lengd í sekúndum
    }


    function setLiveStreamMode() {
        updateTimeLineAndKnobWidth();
        // Breyta textanum á tímalínunni til að sýna "Bein útsending"
        updateTimetotal(true, timeElapsed, slashTime, timeTotal)
        updateDisplayTitle(true, episodeTitle)
        // Debugging upplýsingar í console
        console.log(`Timeline width: ${timelineWidth}px, Knob position: ${newKnobPosition}px`);
    }


    // Uppfæra tímalínuna fyrir upptökur
    function updateRecordingTimeline() {
        console.log('upptöku er spilað')
        const timelineWidth = timeline.getBBox().width;  // Notum `getBBox()` til að fá breidd tímalínunnar í SVG
        const progress = (audioElement.currentTime / audioElement.duration) * timelineWidth;  // Reiknar hlutfallslega framvindu
        // Uppfærir framvindustikuna (progressBar) með því að stilla `width`
        progressBar.setAttribute('width', progress);  // Stillir breidd framvindustikunnar

        // Uppfærir stöðu skífunnar (timelineKnob) með því að stilla `cx` (fyrir `circle`)
        timelineKnob.setAttribute('cx', progress);  // Stillir x-staðsetningu skífunnar í SVG

        // Sækjum titilinn úr localStorage ef episodeTitle er ekki skilgreind
        const savedEpisodeTitle = localStorage.getItem('episodeTitle') || 'Unknown Episode';
        buttonId = localStorage.getItem('buttonId') || 'default-button-id';  // Bæta við buttonId
        displayTitle.textContent = savedEpisodeTitle;
        checkAndAnimateTitle();  // Athugar hvort animation á að virkjast
    }


    function updateBufferInfo() {
        const buffered = audioElement.buffered;
        if (buffered.length > 0) {
            const bufferEnd = buffered.end(buffered.length - 1);
            const bufferMinutes = Math.floor(bufferEnd / 60);
            const bufferSeconds = Math.floor(bufferEnd % 60);

            // Uppfæra upplýsingar um buffer-hleðslu í HTML
            const bufferInfo = document.getElementById('buffer-info');
            bufferInfo.textContent = `Bufferað í: ${bufferMinutes}:${bufferSeconds.toString().padStart(2, '0')} mínútur`;
        }
    }


    // Færa skífuna á tímalínu
    function moveKnob(xPos) {
        const rect = timeline.getBBox();  // Fá stærð tímalínunnar í SVG
        const minX = 6.5;  // Minimum x-position (for the knob)
        const maxX = rect.width - 6.5;  // Maximum x-position (for the knob)

        // Calculate the new x-position, making sure it stays within the min/max bounds
        let newX = Math.max(minX, Math.min(maxX, xPos));

        // Move the knob by updating the 'cx' attribute of the circle
        timelineKnob.setAttribute('cx', newX);

        // Adjust the width of the progress bar by updating the 'width' attribute of the rect
        progressBar.setAttribute('width', newX);

        console.log(`Knob moved to: ${newX}px`);

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
                    console.log(`Updated currentTime for live stream: ${audioElement.currentTime}`);
                }
            }
        } else {
            // For regular audio playback, update the current time based on knob position
            const newTime = (newX / maxX) * audioElement.duration;
            audioElement.currentTime = newTime;
            console.log(`Updated currentTime for recording: ${audioElement.currentTime}`);
        }
    }


    function updateBufferBar() {
        const timelineWidth = timeline.getBBox().width;  // Fá breidd tímalínunnar í SVG
        const buffered = audioElement.buffered;

        if (buffered.length > 0 && !isNaN(audioElement.duration)) {
            const bufferEnd = buffered.end(buffered.length - 1);  // Hvar bufferinn endar

            // Fyrir lifandi streymi (live stream)
            if (isLiveStream) {
                const elapsedTime = audioElement.currentTime;
                const bufferPercentage = (bufferEnd / elapsedTime) * timelineWidth;
                bufferBar.setAttribute('width', bufferPercentage);  // Uppfæra breidd buffer-bar
            } else {
                // Fyrir upptökur eða venjulegar hljóðskrár
                const bufferPercentage = (bufferEnd / audioElement.duration) * timelineWidth;
                bufferBar.setAttribute('width', bufferPercentage);  // Uppfæra breidd buffer-bar
            }
        }
    }


    // Smellur á tímalínuna
    timeline.addEventListener("click", (event) => {

        if (!isLiveStream || (isLiveStream && audioElement.buffered.length > 0)) {
            const rect = timeline.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            moveKnob(clickX);
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


    document.addEventListener("mousemove", (event) => {
        if (isDragging) {
            const rect = timeline.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            moveKnob(mouseX);
        }
    });


    document.addEventListener("mouseup", () => {
        isDragging = false;
    });


    // Fall til að formatta tíma í mínútur og sekúndur
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }



    audioElement.addEventListener('timeupdate', () => {
        const timelineWidth = timeline.getBBox().width;
        const progress = (audioElement.currentTime / audioElement.duration) * timelineWidth;
        if (isLiveStream) {
            // Fá breidd tímalínunnar
            progressBar.setAttribute('width', timelineWidth); // Fyllir tímalínuna alveg
            timeElapsed.textContent = formatTime(audioElement.currentTime);
            // Ef þetta er bein útsending, sýnir aðeins liðinn tíma
            updateTimetotal(true, timeElapsed, slashTime, timeTotal)

        } else if (!isNaN(audioElement.duration)) {
            // Uppfæra breidd framvindustikunnar (progressBar)
            progressBar.setAttribute('width', progress);
            // Uppfæra stöðu skífunnar (timelineKnob)
            timelineKnob.setAttribute('cx', progress);
            updateTimetotal(false, timeElapsed, slashTime, timeTotal)

        } else {
            // Ef duration er NaN, sýna 00:00 / 00:00 sem sjálfgefið
            timeElapsed.textContent = "00:00";
            timeTotal.textContent = "00:00";
        }
    });



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
});