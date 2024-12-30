document.addEventListener('DOMContentLoaded', function () {

    const rssUrl = 'https://rss.app/feeds/_LsjQvMCo0ez1dcAs.xml';
    const audioElement = document.getElementById('audio-element');
    const logo = 'https://utvarpsaga.is/wp-content/uploads/2024/11/logo_utvarp_saga_blar_bakgrunnur.png';

    window.togglePlayPause = togglePlayPause;
    window.dispatchPlayerEvents = dispatchPlayerEvents;
    window.updatePlayPauseButton = updatePlayPauseButton;


    async function fetchEpisodes(rssUrl) {
        try {
            // Hreinsa gömlu gögnin
            localStorage.removeItem('rssData');

            const response = await fetch(rssUrl);
            const str = await response.text();
            localStorage.setItem('rssData', str); // Geyma nýju gögnin
            const data = new window.DOMParser().parseFromString(str, "text/xml");
            renderEpisodes(data);

            // Kalla á fallið eftir að lýsingar hafa verið settar í DOM
            handleEpisodeDescriptions();
        } catch (err) {
            console.error('Error fetching episodes:', err);
        }
    }


    function renderEpisodes(data) {
        const items = data.querySelectorAll("item");
        const html = Array.from(items).map((el, buttonId) => createEpisodeHtml(el, buttonId + 1)).join('');
        document.getElementById('episode-list').innerHTML = html;
    }


    function createEpisodeHtml(el, buttonId) {
        const title = el.querySelector("title")?.textContent || 'Ónefndur þáttur';
        const audioUrl = el.querySelector("enclosure")?.getAttribute("url") || '';
        const description = sanitizeDescription(el.querySelector("description")?.textContent || 'Engin lýsing til staðar.');
        const pubDate = formatDate(new Date(el.querySelector("pubDate")?.textContent));
        const imageUrl = el.querySelector("image > url")?.textContent || '';
        const imageElement = imageUrl ? `<img src="${imageUrl}" alt="Þáttur Mynd" onerror="this.style.display='none'">` : '';

        return `
            <li class="episode">
                <div class="episode-info">
                    ${imageElement}
                    <strong>${title}</strong>
                    <div class="episode-description">
                        ${description}
                    </div>
                    ${createPlayPauseButton(buttonId, audioUrl)}
                    <span>${pubDate}</span>
                    <button class="show-more-btn">Lesa meira</button>
                </div>
            </li>
        `;
    }



    function createPlayPauseButton(buttonId, audioUrl) {
        return `
            <svg id="play-pause-btn-${buttonId}" class="play-pause-btn" data-id="${buttonId}" data-audio-url="${audioUrl}"
                width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">                
                <circle cx="19.5" cy="19.5" r="19.5" fill="#392BFF"/>
                <path d="M13.0615 12.4164C13.0664 10.8768 14.736 9.91976 16.067 10.6937L29.028 18.2311C30.359 19.0051 30.3529 20.9296 29.0172 21.6952L16.009 29.1512C14.6733 29.9168 13.0097 28.9493 13.0145 27.4097L13.0615 12.4164Z" fill="#FFFCFC"/>
            </svg>
        `;
    }



    function sanitizeDescription(description) {
        return description.replace(/--.*?(<\/div>)/, '$1');
    }



    fetchEpisodes(rssUrl);


    function getButtonById(buttonId) {

        if (!buttonId || buttonId === 'default-button-id') {
            console.warn('Ógilt eða sjálfgefið buttonId:', buttonId);
            return null;
        }

        const button = document.querySelector(`#play-pause-btn-${buttonId}`);
        if (!button) {
            console.warn('Button not found for buttonId:', buttonId);
        }
        return button;
    }


    function handleEpisodeDescriptions() {
        document.querySelectorAll('.episode-description > div > div').forEach(description => {
            console.log('Fann lýsingu:', description);
            console.log('Lýsingartexti:', description.textContent.trim());

            const episodeInfo = description.closest('.episode-info');
            const showMoreButton = episodeInfo.querySelector('.show-more-btn');

            if (!description || description.textContent.trim() === '' || description.scrollHeight < 95) {
                showMoreButton.classList.add('hidden'); // Felur hnappinn
                showMoreButton.classList.remove('visible');
            } else {
                showMoreButton.classList.add('visible'); // Sýnir hnappinn
                showMoreButton.classList.remove('hidden');
            }
        });
    }



    document.addEventListener('click', function (event) {
        if (event.target.matches('.show-more-btn')) {
            const description = event.target.closest('.episode-info').querySelector('.episode-description > div > div');
            description.classList.toggle('expanded');
            event.target.textContent = description.classList.contains('expanded') ? 'Sjá minna' : 'Lesa meira';
        }
    });



    function saveEpisodeData(buttonId, episodeTitle, imageUrl, audioUrl) {

        if (!buttonId || buttonId <= 0 || !audioUrl) {
            console.warn("Ógilt buttonId eða gögn í saveEpisodeData:", { buttonId, episodeTitle, imageUrl, audioUrl });
            return;
        }
        localStorage.setItem('buttonId', buttonId);
        localStorage.setItem('episodeTitle', episodeTitle);
        localStorage.setItem('imageUrl', imageUrl);
        localStorage.setItem('audioUrl', audioUrl);  // Bætir við audioUrl í localStorage
    }


    // Sameinaða dispatchPlayerEvents aðferðin
    function dispatchPlayerEvents(action, buttonId, audioUrl = null, episodeTitle = null) {
        if (action === 'pause') {
            const pauseEvent = new CustomEvent('playerPaused', { detail: { buttonId } });
            document.dispatchEvent(pauseEvent);
        } else if (action === 'play' && audioUrl && episodeTitle) {
            const playEvent = new CustomEvent('playerStarted', { detail: { audioUrl, episodeTitle, buttonId } });
            document.dispatchEvent(playEvent);
        }
    }


    function updatePlayPauseButton(button, isPlaying) {
        button.setAttribute('data-playing', String(isPlaying));
        button.innerHTML = getPlayPauseSvg(isPlaying);
    }


    // Fall til að búa til SVG fyrir play/pause takka
    function getPlayPauseSvg(isPlaying) {
        return isPlaying
            ? `<svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="19.5" cy="19.5" r="19.5" fill="#392BFF"/>
            <rect x="11" y="9.80029" width="6" height="19.7259" rx="3" fill="white"/>
            <rect x="22" y="9.80029" width="6" height="19.7259" rx="3" fill="white"/>
        </svg>`
            : `<svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="19.5" cy="19.5" r="19.5" fill="#392BFF"/>
            <path d="M13.0635 12.4164C13.0683 10.8768 14.738 9.91976 16.0689 10.6937L29.03 18.2311C30.3609 19.0051 30.3549 20.9296 29.0191 21.6952L16.011 29.1512C14.6753 29.9168 13.0116 28.9493 13.0164 27.4097L13.0635 12.4164Z" fill="#FFFCFC"/>
        </svg>`;
    };


    // scripts.js
    const liveStreamUrl = localStorage.getItem('liveStreamUrl');

    if (liveStreamUrl) {
        isLiveStream = audioElement.src === liveStreamUrl;
    }


    // Skilgreina audioElement ef það er ekki þegar skilgreint
    const storedAudioSource = localStorage.getItem('audioSource');
    if (storedAudioSource) {
        audioElement.src = storedAudioSource;
    }


    window.addEventListener('updateStreamStatus', (event) => {
        let isLiveStream = event.detail.isLiveStream;
        if (isLiveStream) {
            console.log('Þetta er bein útsending');
        } else {
            console.log('Þetta er upptaka');
        }
    });


    document.addEventListener('playerPaused', function (event) {
        const { buttonId } = event.detail;  // Fáum buttonId frá viðburðinum
        console.log('Received playerPaused event for buttonId:', buttonId);

        if (buttonId) {
            const button = document.querySelector(`#play-pause-btn-${buttonId}`);
            if (button) {
                // Í playerPaused event handler:
                updatePlayPauseButton(button, false);
            } else {
                console.warn(`Hnappur fannst ekki fyrir buttonId: ${buttonId}`);
            }
        } else {
            console.warn("Ógildur buttonId í playerPaused atburði.");
        }
    });


    // Listen for play event from saga-player.js
    document.addEventListener('playerStarted', function (event) {
        const { buttonId } = event.detail;
        const button = getButtonById(buttonId);
        if (button) {
            // Í playerStarted event handler:
            updatePlayPauseButton(button, true);
        }
    });


    // Event delegation fyrir Play/Pause atburðina
    document.addEventListener('click', function (event) {
        const button = event.target.closest('.play-pause-btn');
        if (!button) return; // Ekki gera neitt ef ekki er smellt á play/pause hnapp

        // Sækja upplýsingar úr data-attributum
        const audioUrl = button.getAttribute('data-audio-url');
        const episodeTitle = button.closest('.episode-info').querySelector('strong').textContent;
        const buttonId = button.getAttribute('data-id');
        const imageUrl = button.closest('.episode-info').querySelector('img')?.src || logo;
        // Vista buttonId í localStorage
        togglePlayPause(button, audioUrl, episodeTitle, buttonId, imageUrl);
    });


    function togglePlayPause(button, audioUrl, episodeTitle, buttonId, imageUrl) {

        let isLiveStream = localStorage.getItem('isLiveStream') === 'true';

        const previousButtonId = localStorage.getItem('buttonId');

        // Ef núverandi spilun er bein útsending og við skiptum yfir í þátt
        if (isLiveStream && previousButtonId !== buttonId) {
            audioElement.pause();
            localStorage.setItem('isPlaying', 'false');
            localStorage.setItem('isLiveStream', 'false');
        }

        if (previousButtonId && previousButtonId !== buttonId) {

            // Stöðva fyrri þátt og uppfæra hnappinn
            const pauseEvent = new CustomEvent('playerPaused', { detail: { buttonId: previousButtonId } });
            document.dispatchEvent(pauseEvent);
            if (!audioElement.paused) {
                audioElement.pause();
                localStorage.setItem('isPlaying', 'false');
            }
        }

        if (!buttonId || buttonId === "default-button-id") {
            console.warn("Ógilt buttonId:", buttonId);
            return;
        }

        let isPlaying = localStorage.getItem('isPlaying') === 'true';

        if (isLiveStream) {
            imageUrl = logo;
        }


        if (isPlaying) {
            pauseAudio();
            updatePlayPauseButton(button, false);
            dispatchPlayerEvents('pause', buttonId);

        } else {
            // Stöðva alla aðra þætti
            pauseOtherEpisodes(button);

            // Vista þáttaupplýsingar og stilla `imageUrl` fyrir þáttinn
            const episodeInfo = button.closest('.episode-info');
            const updatedImageUrl = episodeInfo && episodeInfo.querySelector('img')
                ? episodeInfo.querySelector('img').src
                : imageUrl;
            saveEpisodeData(buttonId, episodeTitle, updatedImageUrl, audioUrl); // Vista upplýsingar um þátt
            playAudioInSagaPlayer(audioUrl, episodeTitle, buttonId, updatedImageUrl, isLiveStream); // Kalla á `startPlayer`
            updatePlayPauseButton(button, true);
            dispatchPlayerEvents('play', buttonId, audioUrl, episodeTitle);
        }
    }


    function pauseAudio() {
        if (audioElement) {
            if (!audioElement.paused) {
                pauseSagaPlayer();  // Make sure Saga Player is paused too             
                localStorage.setItem('isPlaying', 'false');
            }
        }
    }


    function pauseOtherEpisodes(activeButton) {
        const buttons = document.querySelectorAll('.play-pause-btn');

        buttons.forEach(svg => {
            if (svg !== activeButton && svg.getAttribute('data-playing') === 'true') {
                // Í playerPaused event handler:
                updatePlayPauseButton(svg, false);
                svg.setAttribute('data-playing', 'false');
            }
        });
    }


    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }
});