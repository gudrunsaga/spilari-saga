document.addEventListener('DOMContentLoaded', function () {

    const rssUrl = 'https://rss.app/feeds/_LsjQvMCo0ez1dcAs.xml';
    const audioElement = document.getElementById('audio-element');

    window.togglePlayPause = togglePlayPause;
    window.dispatchPlayerEvents = dispatchPlayerEvents;
    window.updatePlayPauseButton = updatePlayPauseButton;

    fetch(rssUrl)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
            const items = data.querySelectorAll("item");
            let html = '';
            items.forEach((el, index) => {

                const title = el.querySelector("title").textContent;
                const audioUrl = el.querySelector("enclosure").getAttribute("url");
                let description = el.querySelector("description").textContent;
                const pubDate = formatDate(new Date(el.querySelector("pubDate").textContent));
                const imageUrl = el.querySelector("image > url") ? el.querySelector("image > url").textContent : '';

                let imageElement = '';
                if (imageUrl) {
                    imageElement = `<img src="${imageUrl}" alt="Þáttur Mynd" onerror="this.style.display='none'">`;
                }

                description = description.replace(/--.*?(<\/div>)/, '$1');

                // Setja inn skilyrði til að birta hnappinn aðeins ef lýsingin er lengri en ákveðið skilyrði
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = description;
                document.body.appendChild(tempDiv); // Þarf tímabundið til að fá hæðina

                if (tempDiv.scrollHeight > 100) { // Skilyrði fyrir lengd lýsingar
                    html += `
                        <li class="episode">
                            <div class="episode-info">
                                ${imageElement}
                                <strong>${title}</strong>

                                <div class="episode-description">
                                ${description}
                                </div>
<svg id="play-pause-btn-${index}" class="play-pause-btn" data-id="${index}" data-audio-url="${audioUrl}" 
        width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg" 
        onclick="togglePlayPause(this, '${audioUrl}', '${title}', '${index}', '${imageElement}')">                                    <circle cx="19.5" cy="19.5" r="19.5" fill="#392BFF"/>
                                    <path d="M13.0615 12.4164C13.0664 10.8768 14.736 9.91976 16.067 10.6937L29.028 18.2311C30.359 19.0051 30.3529 20.9296 29.0172 21.6952L16.009 29.1512C14.6733 29.9168 13.0097 28.9493 13.0145 27.4097L13.0615 12.4164Z" fill="#FFFCFC"/>
                                </svg>

                                <span>${pubDate}</span>
   
                                <button class="show-more-btn">Lesa meira</button>
                                                       
                                </div>
                        </li>`;
                } else {
                    html += `
                        <li class="episode">
                            <div class="episode-info">
                                ${imageElement}
                                <strong>${title}</strong>
                                
                                <div class="episode-description">
                                ${description}
                                   </div>
                           
                                <svg id="play-pause-btn-${index}" class="play-pause-btn" data-id="${index}" data-audio-url="${audioUrl}" 
        width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg" 
        onclick="togglePlayPause(this, '${audioUrl}', '${title}', '${index}', '${imageElement}')">
                                    <circle cx="19.5" cy="19.5" r="19.5" fill="#392BFF"/>
                                    <path d="M13.0615 12.4164C13.0664 10.8768 14.736 9.91976 16.067 10.6937L29.028 18.2311C30.359 19.0051 30.3529 20.9296 29.0172 21.6952L16.009 29.1512C14.6733 29.9168 13.0097 28.9493 13.0145 27.4097L13.0615 12.4164Z" fill="#FFFCFC"/>
                                </svg>
                                                                  <span>${pubDate}</span>
                               
                                </div>
                        </li>`;
                }

                document.body.removeChild(tempDiv); // Fjarlægja tímabundið element
                // Kalla á saveEpisodeData með öllum gögnum
                saveEpisodeData(index, title, imageUrl, audioUrl);
            });
            document.getElementById('episode-list').innerHTML = html;


            // Bæta við atburðarhandlerum fyrir "Lesa meira" hnappana
            document.querySelectorAll('.show-more-btn').forEach(button => {
                button.addEventListener('click', function () {
                    // Finna þáttalýsinguna út frá `button` án `episode-description-container`
                    const descriptionDiv = button.parentElement.querySelector('.episode-description > div > div');

                    if (descriptionDiv.classList.contains('expanded')) {
                        descriptionDiv.classList.remove('expanded');
                        button.textContent = 'Lesa meira';
                    } else {
                        descriptionDiv.classList.add('expanded');
                        button.textContent = 'Sjá minna';
                    }
                });
            });
        })
        .catch(err => console.log(err));


    function getButtonById(buttonId) {

        if (!buttonId) {
            console.warn('Ógilt buttonId:', buttonId);
            return null;
        }

        const button = document.querySelector(`#play-pause-btn-${buttonId}`);
        if (!button) {
            console.warn('Button not found for buttonId:', buttonId);
        }
        return button;
    }


    // Nýtt fall til að skila réttu Play eða Pause SVG
    function getPlayPauseSvg(isPlaying) {
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


    function saveEpisodeData(buttonId, episodeTitle, imageUrl, audioUrl) {
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


    // scripts.js
    const liveStreamUrl = localStorage.getItem('liveStreamUrl');

    if (liveStreamUrl) {
        isLiveStream = audioUrl === liveStreamUrl;
    }


    // Skilgreina audioElement ef það er ekki þegar skilgreint
    const storedAudioSource = localStorage.getItem('audioSource');
    if (storedAudioSource) {
        audioElement.src = storedAudioSource;
        audioElement.load();
    }


    window.addEventListener('updateStreamStatus', (event) => {
        const isLiveStream = event.detail.isLiveStream;
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
            const button = getButtonById(buttonId);
            if (button) {
                // Í playerPaused event handler:
                updatePlayPauseButton(button, false);
            }
        }
    });


    // Listen for play event from saga-player.js
    document.addEventListener('playerStarted', function (event) {
        const { audioUrl, episodeTitle, buttonId } = event.detail;
        const button = getButtonById(buttonId);
        console.log("buttonId í lplayerStarted í script:", buttonId);
        if (button) {
            // Í playerStarted event handler:
            updatePlayPauseButton(button, true);
        }
    });


    function togglePlayPause(button, audioUrl, episodeTitle, buttonId, imageUrl) {
        // Sækja spilunarstöðu (isPlaying) út frá hnappinum
        const isPlaying = button.getAttribute('data-playing') === 'true';

        // Ef um beina útsendingu er að ræða, stilltu myndina á logoUrl
        if (audioUrl === liveStreamUrl) {
            imageUrl = logoUrl;
            localStorage.setItem('imageUrl', logoUrl); // Geyma logoUrl í localStorage fyrir beina útsendingu
        }

        // Athuga hvort `buttonId` sé gildur, ef ekki tilkynna villu og hætta
        if (!buttonId || buttonId === "") {
            console.warn("Ógilt buttonId:", buttonId);
            return; // Stöðva framkvæmd ef buttonId er ógilt
        }

        if (isPlaying) {
            // Ef spilarinn er í gangi, stöðva hann og uppfæra hnappinn
            pauseAudio();
            updatePlayPauseButton(button, false);
            dispatchPlayerEvents('pause', buttonId); // Senda 'pause' atburð með buttonId
        } else {
            // Ef spilarinn er ekki í gangi, hefja spilun

            // Geyma þáttaupplýsingar
            saveEpisodeData(buttonId, episodeTitle, imageUrl, audioUrl);

            // Uppfæra mynd slóð ef hún er til staðar
            const episodeInfo = button.closest('.episode-info');
            const updatedImageUrl = episodeInfo && episodeInfo.querySelector('img')
                ? episodeInfo.querySelector('img').src
                : imageUrl;
            localStorage.setItem('imageUrl', updatedImageUrl);

            // Uppfæra episodeTitle ef það er til staðar
            episodeTitle = episodeInfo ? episodeInfo.querySelector('strong').textContent : 'Enginn þáttur';
            localStorage.setItem('episodeTitle', episodeTitle);

            // Stöðva aðra þætti ef til þarf
            pauseOtherEpisodes(button);

            // Hefja spilun og uppfæra hnappinn
            startPlayback(audioUrl, episodeTitle, buttonId, imageUrl, audioUrl === liveStreamUrl);
            updatePlayPauseButton(button, true);

            // Senda 'play' atburð með buttonId og þáttaupplýsingum
            dispatchPlayerEvents('play', buttonId, audioUrl, episodeTitle);
        }
    }


    function pauseOtherEpisodes(activeButton) {
        const buttons = document.querySelectorAll('.play-pause-btn');

        buttons.forEach(svg => {
            if (svg !== activeButton && svg.getAttribute('data-playing') === 'true') {
                // Í playerPaused event handler:
                updatePlayPauseButton(svg, false);
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