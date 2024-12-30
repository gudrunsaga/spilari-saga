// Skilgreina playerUtils ef það er ekki nú þegar til
/*window.playerUtils = window.playerUtils || {};

// Set default volume level
window.playerUtils.volumeAt15dB = 0.1779;



// Stillingar spilarans
window.playerUtils.saveEpisodeData = function ({ buttonId, episodeTitle, imageUrl, audioUrl, isLiveStream, isPlaying, playerTime, slashTimeContent, timeTotal, playerVolume }) {
    const audioElement = document.getElementById('audio-element');

    const episodeData = {
        buttonId,
        episodeTitle,
        imageUrl,
        audioUrl,
        isLiveStream,
        isPlaying,
        playerTime: playerTime || audioElement.currentTime, // Vista núverandi spilunartíma
        slashTimeContent,
        timeTotal: timeTotal || audioElement.timeTotal,
        playerVolume: playerVolume || audioElement.volume, // Vista núverandi hljóðstyrk
    };
    localStorage.setItem('sagaPlayerEpisode', JSON.stringify(episodeData));
    localStorage.setItem('buttonId', buttonId); // Vista buttonId sér

};



window.playerUtils.syncButtonState = function () {
    const activeButtonId = localStorage.getItem('buttonId');
    document.querySelectorAll('.play-pause-btn').forEach(button => {
        const isActive = button.getAttribute('data-id') === activeButtonId;
        if (isActive) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
};


window.playerUtils.updatePlayPauseButton = function (button, isPlaying) {
    button.setAttribute('data-playing', String(isPlaying));
    button.innerHTML = window.playerUtils.getPlayPauseSvg(isPlaying);
}

// Nýtt fall til að skila réttu Play eða Pause SVG
window.playerUtils.getPlayPauseSvg = function (isPlaying) {
    return isPlaying ? `
        <svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="19.5" cy="19.5" r="19.5" fill="#392BFF"/>
            <rect x="11" y="9.80029" width="6" height="19.7259" rx="3" fill="white"/>
            <rect x="22" y="9.80029" width="6" height="19.7259" rx="3" fill="white"/>
        </svg>` : `
        <svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="19.5" cy="19.5" r="19.5" fill="#392BFF"/>
            <path d="M13.0635 12.4164C13.0683 10.8768 14.738 9.91976 16.0689 10.6937L29.03 18.2311C30.3609 19.0051 30.3549 20.9296 29.0191 21.6952L16.011 29.1512C14.6753 29.9168 13.0116 28.9493 13.0164 27.4097L13.0635 12.4164Z" fill="#FFFCFC"/>
        </svg>`;
}



window.playerUtils.loadPlayerState = function () {
    try {
        const savedState = JSON.parse(localStorage.getItem('playerState'));
        if (!savedState) return;

        const {
            playerTime,
            slashTimeContent,
            timeTotal: savedTimeTotal,
            audioUrl,
            buttonId,
            playerVolume,
            displayTitle: episodeTitle,
            isLiveStream,
            isPlaying: initialIsPlaying,
            liveStreamUrl,
            imageUrl
        } = savedState;

        const audioElement = document.getElementById('audio-element');
        const displayTitle = document.getElementById('displaying-title');
        const displayImage = document.querySelector('.episode-image img');
        const logoUrl = 'https://wordpress-1000093-3520884.cloudwaysapps.com/wp-content/uploads/2024/10/logo_utvarp_saga_blar_bakgrunnur.png';
        const slashTime = document.getElementById('slash-time'); // Element sem sýnir heildartíma hljóðsins
        const timeTotal = document.getElementById('time-total');

        // Endurheimta vistaða mynd
        const savedEpisode = JSON.parse(localStorage.getItem('sagaPlayerEpisode'));
        if (savedEpisode && savedEpisode.imageUrl) {
            const displayImage = document.querySelector('.episode-image img');
            displayImage.src = savedEpisode.imageUrl;
        }


        let currentIsPlaying = initialIsPlaying || false;
        if (audioElement) {
            audioElement.currentTime = playerTime ? parseFloat(playerTime) : 0;
            audioElement.src = audioUrl || 'https://stream.utvarpsaga.is/Hljodver';
            audioElement.volume = playerVolume && !isNaN(playerVolume) ? parseFloat(playerVolume) : 0.5; // Sjálfgefinn hljóðstyrkur
        }

        if (displayTitle) {
            displayTitle.textContent = episodeTitle || 'Útvarp Saga';
        }

        if (displayImage) {
            displayImage.src = imageUrl || logoUrl;
        }

        // Virkja hnapp eftir auðkenni
        if (buttonId) {
            const button = document.getElementById(`play-pause-btn-${buttonId}`);
            if (button) {
                button.classList.add('active');
            }
        }


        if (slashTime && slashTimeContent) {
            slashTime.textContent = slashTimeContent || '/'; // Endurheimta efni fyrir slashTime
        }


        if (timeTotal) {
            timeTotal.textContent = savedTimeTotal || "00:00"; // Sjálfgefin texti ef ekkert gildi er vistað
        }

        if (isLiveStream) {
            // Stilla beina útsendingu
            audioElement.src = liveStreamUrl;
            displayTitle.textContent = 'Bein útsending';
            displayImage.src = logoUrl;
            slashTimeContent = '';
            savedTimeTotal = '';
            audioElement.addEventListener('timeupdate', updateLiveTimeline);
        } else if (audioUrl) {
            // Byrja síðasta valda þátt
            audioElement.src = audioUrl;
            const totalTime = window.playerUtils.formatTime(audioElement.duration);
            timeTotal.textContent = totalTime;
            audioElement.addEventListener('loadedmetadata', () => {
                timeTotal.textContent = window.playerUtils.formatTime(audioElement.duration);
            });
        }

        // Vista uppfært ástand
        savedState.isPlaying = currentIsPlaying;
        localStorage.setItem('playerState', JSON.stringify(savedState));

        // Synca hnappastöðu eftir hleðslu
        window.playerUtils.syncButtonState();
    } catch (e) {
        console.error('Error loading player state:', e);
    }
};


window.playerUtils.getValidatedState = function (key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return defaultValue;
        const parsedData = JSON.parse(data);
        // Sannreyna gögn hér
        return parsedData;
    } catch (e) {
        console.error(`Error parsing localStorage data for key: ${key}`, e);
        return defaultValue;
    }
};


window.playerUtils.loadEpisodeData = function () {
    const data = localStorage.getItem('sagaPlayerEpisode');
    return data ? JSON.parse(data) : null;
}


window.playerUtils.clearEpisodeData = function () {
    localStorage.removeItem('sagaPlayerEpisode');
}


// Geymir þáttalista í localStorage
window.playerUtils.saveEpisodeList = function (episodes) {
    localStorage.setItem('sagaPlayerEpisodes', JSON.stringify(episodes));
}


// Sækir þáttalista úr localStorage
window.playerUtils.loadEpisodeList = function () {
    const episodes = localStorage.getItem('sagaPlayerEpisodes');
    return episodes ? JSON.parse(episodes) : [];
}


// Dæmi um að fjarlægja breytur úr localStorage
window.playerUtils.resetLiveStreamSettings = function () {
    localStorage.removeItem('isLiveStream');  // Fjarlægja að það er bein útsending
    localStorage.removeItem('liveStreamUrl');  // Fjarlægja URL beinnar útsendingar
}


// Dæmi um að uppfæra breytur í localStorage
window.playerUtils.savePlaybackSettings = function (isLiveStream, audioUrl) {
    localStorage.setItem('isLiveStream', isLiveStream);
    localStorage.setItem('currentAudioUrl', audioUrl);  // Geyma slóð á hljóðskrá
}


// Kalla á resetLiveStreamSettings þegar skipt er frá beinni útsendingu til upptöku
window.playerUtils.switchToEpisode = function (audioUrl) {
    resetLiveStreamSettings();  // Hreinsa stöðu beinnar útsendingar
    savePlaybackSettings(false, audioUrl);  // Vista nýjar upplýsingar um upptöku
}



window.playerUtils.updateTimeDisplay = function () {

    const audioElement = document.getElementById('audio-element');
    const timeElapsed = document.getElementById('time-elapsed'); // Element sem sýnir liðinn tíma
    const slashTime = document.getElementById('slash-time'); // Element sem sýnir liðinn tíma
    const timeTotal = document.getElementById('time-total'); // Element sem sýnir heildartíma hljóðsins

    isLiveStream = localStorage.getItem('isliveStream');
    if (!isLiveStream) {
        const currentTime = window.playerUtils.formatTime(audioElement.currentTime);
        const totalTime = window.playerUtils.formatTime(audioElement.duration);
        timeElapsed.textContent = currentTime;
        slashTime.textContent = " / "
        timeTotal.textContent = totalTime;
    } else if (isLiveStream) {
        timeTotal.textContent = " ";
        slashTime.textContent = " ";
        timeTotal.style.display = "none";
        slashTime.style.display = "none";
    } else {
        timeElapsed.textContent = "00:00";
        slashTime.textContent = " / "
        timeTotal.textContent = "00:00";
    }
    slashTime.style.display = "block";
    timeTotal.style.display = "block";
}


window.playerUtils.savePlayerState = function (isPlaying, audioUrl, playerTime, slashTimeContent, timeTotal, buttonId, volumeLevel, displayTitle, isLiveStream, liveStreamUrl, imageUrl, timelineProgress) {
    try {
        const audioElement = document.getElementById('audio-element');

        timelineProgress = (audioElement.currentTime / audioElement.duration) * 100

        const playerState = {
            isPlaying: isPlaying,
            audioUrl: audioUrl,
            playerTime: playerTime || document.getElementById('audio-element').currentTime, // Notar núverandi spilunartíma
            slashTimeContent,
            timeTotal,
            buttonId: buttonId,
            volumeLevel: volumeLevel,
            displayTitle: displayTitle,
            isLiveStream: isLiveStream,
            liveStreamUrl: liveStreamUrl,
            imageUrl: imageUrl,
            timelineProgress: timelineProgress
        };

        if (audioElement.paused) {
            isPlaying = false;
        } else {
            isPlaying = true;
        }
        localStorage.setItem('playerState', JSON.stringify(playerState));
    } catch (e) {
        console.error('Error storing player state:', e);
    }
}


// Aðferðir fyrir spilarann, til dæmis:
window.playerUtils.playAudio = function (audioUrl) {
    const audioElement = document.getElementById('audio-element');
    if (audioElement) {
        audioElement.volume = window.playerUtils.volumeAt15dB;  // Nota grunnstillingu fyrir hljóðstyrk
        audioElement.src = audioUrl;
        audioElement.play().catch(err => console.error('Error playing audio:', err));
    } else {
        console.error('Audio element not found!');
    }
};


// Fall til að formatta tíma í mínútur og sekúndur
window.playerUtils.formatTime = function (seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}


// Sameiginlegt fall: Uppfæra tímalínu í SVG
window.playerUtils.updateTimeline = function (audioElement, timeline, progressBar, timelineKnob) {
    if (!audioElement.duration) return; // Athuga hvort duration sé gild
    const progress = (audioElement.currentTime / audioElement.duration) * timeline.getBBox().width;
    progressBar.setAttribute('width', progress || 0);
    timelineKnob.setAttribute('cx', progress || 0);
};


// Sjálfgefin gögn fyrir beina útsendingu
window.playerUtils.setLiveStreamState = function () {
    const liveStreamUrl = window.playerUtils.playerConfig.liveStreamUrl;
    window.playerUtils.sagaPlayerData = {
        isLiveStream: true,
        currentAudio: {
            url: liveStreamUrl,
            title: 'Bein útsending',
            image: window.playerUtils.playerConfig.logoUrl,
            episodeId: 'live',
        },
    };
    window.playerUtils.saveSagaPlayerData();
};

*/