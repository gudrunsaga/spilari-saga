(function (window) {
    const playerConfig = {
        volumeAt15dB: 0.1779,
        maxVolumeHeight: 87,
        liveStreamUrl: 'https://stream.utvarpsaga.is/Hljodver',
        logoUrl: 'https://wordpress-1000093-3520884.cloudwaysapps.com/wp-content/uploads/2024/10/logo_utvarp_saga_blar_bakgrunnur.png'
    };

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
        localStorage.setItem('audioUrl', audioUrl);
    }

    // Gera aðgengilegt í gegnum `window` fyrir önnur skrár
    window.playerUtils = {
        playerConfig,
        getPlayPauseSvg,
        saveEpisodeData
    };

})(window);
