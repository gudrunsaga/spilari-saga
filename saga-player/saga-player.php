<?php
/*
Plugin Name: Saga Player
Description: Shortcode fyrir spilarann Saga Player
Version: 1.0
Author: Guðrún Stella Ágústsdóttir
*/

// Aðferð til að hlaða CSS og JS skrárnar aðeins þegar shortcoden er notaður
function enqueue_saga_player_files() {
    // Hlaða player-utils.js
    wp_enqueue_script('player-utils', plugin_dir_url(__FILE__) . 'player-utils.js', array(), null, true);
    // Hlaða CSS
    wp_enqueue_style('saga-player-style', plugin_dir_url(__FILE__) . 'styles.css');
    //wp_enqueue_script('google-sheets-script', site_url() . '/saga-spilar/script.js', array(), null, true);
    
    // Hlaða JavaScript
   wp_enqueue_script('saga-player-script', plugin_dir_url(__FILE__) . 'saga-player.js', array(), null, true);
}
add_action('wp_enqueue_scripts', 'enqueue_saga_player_files');

// Shortcode function sem kallar á spilarann
function saga_player_shortcode() {
    // Tryggir að CSS og JS sé hlaðið aðeins þegar shortcode er notað
    enqueue_saga_player_files();

    // Byrja output buffering fyrir HTML spilarans
    ob_start();
    ?>
<div class="controller_containers">
<div class="display-title-container">
<div id="episode-image" class="episode-image">
    <img src="" alt="Þátta mynd">
</div>
<div class="display-title">
                <span id="displaying-title"></span>
                <div id="error-message" style="display: none;"></div>
                <button id="retry-button" style="display: none;" onclick="retryStream()">Reyna aftur</button>
            </div>

    <!-- Bein útsending hnappur fyrir ofan spilarann -->
    <div id="live-stream-button" class="live-stream-btn">
<svg width="64" height="32" viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M25.4002 9.49672C25.405 7.95712 27.0747 7.00011 28.4056 7.77409L40.3838 14.7399C41.7147 15.5139 41.7087 17.4384 40.373 18.204L28.3513 25.0945C27.0155 25.8601 25.3519 24.8926 25.3567 23.3531L25.4002 9.49672Z" fill="#FF0000"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M45.7599 7.31309C45.0294 7.88428 45.0024 8.97568 45.6147 9.67211C47.4645 11.7764 48.5 14.266 48.5 16.777C48.5 18.718 47.8813 20.6463 46.7459 22.3936C46.2813 23.1087 46.3744 24.0819 47.0462 24.6072V24.6072C47.687 25.1083 48.6173 25.0147 49.0781 24.3443C50.622 22.0983 51.5 19.5195 51.5 16.777C51.5 13.2778 50.0706 10.0449 47.6523 7.4299C47.1569 6.8942 46.3347 6.86365 45.7599 7.31309V7.31309ZM17.6232 9.97943C18.2044 9.27681 18.1624 8.21021 17.4441 7.64853V7.64853C16.8558 7.18848 16.0113 7.23096 15.5208 7.79413C13.3011 10.3425 12 13.4385 12 16.777C12 19.3536 12.775 21.7857 14.149 23.9331C14.5979 24.6346 15.5531 24.7446 16.2092 24.2315V24.2315C16.8676 23.7167 16.9736 22.7701 16.5416 22.0546C15.5418 20.3984 15 18.5933 15 16.777C15 14.3872 15.9379 12.0168 17.6232 9.97943Z" fill="#FF0000"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M50.664 4.31465C49.9343 4.88521 49.9011 5.97425 50.5317 6.65267C53.3054 9.6364 54.8887 13.2549 54.8887 16.9818C54.8887 20.2641 53.6606 23.4623 51.4729 26.2168C50.9224 26.9099 50.9929 27.9343 51.6901 28.4795V28.4795C52.3028 28.9586 53.1852 28.8933 53.678 28.2915C56.3408 25.0405 57.8887 21.1554 57.8887 16.9818C57.8887 12.26 55.9074 7.90746 52.572 4.42454C52.0653 3.89539 51.2412 3.86335 50.664 4.31465V4.31465ZM13.3559 6.65381C13.9865 5.97537 13.9531 4.88639 13.2235 4.31586V4.31586C12.6463 3.86454 11.8221 3.89661 11.3154 4.42583C7.98077 7.90853 6 12.2606 6 16.9818C6 21.1548 7.54747 25.0394 10.2095 28.2901C10.7023 28.892 11.5847 28.9573 12.1975 28.4782V28.4782C12.8947 27.933 12.9652 26.9087 12.4148 26.2156C10.2277 23.4613 9 20.2636 9 16.9818C9 13.2553 10.5829 9.63732 13.3559 6.65381Z" fill="#FF0000"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M55.0213 0.31685C54.285 0.892579 54.2572 1.9947 54.915 2.65866C58.7671 6.54664 61 11.3805 61 16.4253C61 21.0328 59.1373 25.4645 55.8796 29.1602C55.2823 29.8378 55.3392 30.8907 56.0507 31.4471V31.4471C56.6483 31.9143 57.5048 31.8637 58.0122 31.2998C61.7809 27.1112 64 21.975 64 16.4253C64 10.3589 61.3486 4.78665 56.9199 0.406069C56.4047 -0.103568 55.5922 -0.129548 55.0213 0.31685V0.31685ZM9.08656 2.6571C9.74449 1.99316 9.7167 0.890962 8.98037 0.315203V0.315203C8.40952 -0.131163 7.59705 -0.105219 7.08181 0.404336C2.65212 4.78518 0 10.3581 0 16.4253C0 21.9758 2.2197 27.1127 5.98946 31.3016C6.49688 31.8654 7.35329 31.916 7.95083 31.4488V31.4488C8.6624 30.8924 8.71926 29.8394 8.12189 29.1619C4.86321 25.4658 3 21.0335 3 16.4253C3 11.3798 5.23348 6.54534 9.08656 2.6571Z" fill="#FF0000"/>
</svg>
</div>

        </div>        

        <div class="timeline-container">
    
            <!-- Tímalínan -->
            <svg id="timeline" height="12" viewBox="0 0 700 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="12" rx="6" fill="#392BFF"/>
                
                <rect id="progress-bar" x="2" y="4" width="5" height="4" rx="2.5" fill="white"/>
<!--rect id="buffer-bar" x="2" y="4" width="5" height="4" rx="2.5" fill="#FFFFFF"/ -->
                <circle id="timeline-knob" cx="6" cy="6" r="5" fill="#white"/>
            </svg>

        </div>
        
        <div class="play_pause_volume_control">

        <div class="play_pause">
        <!-- Play hnappurinn -->
        <svg id="play-btn" width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="19.5" cy="19.5" r="19.5" fill="#392BFF"/>
            <path d="M13.0635 12.4164C13.0683 10.8768 14.738 9.91976 16.0689 10.6937L29.03 18.2311C30.3609 19.0051 30.3549 20.9296 29.0191 21.6952L16.011 29.1512C14.6753 29.9168 13.0116 28.9493 13.0164 27.4097L13.0635 12.4164Z" fill="#FFFFFF"/>
        </svg>
    
        <!-- Pause hnappurinn -->
        <svg id="pause-btn" width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19.5" cy="19.5" r="19.5" fill="#392BFF"/>
<rect x="11" y="9.80029" width="6" height="19.7259" rx="3" fill="FFFFFF"/>
<rect x="22" y="9.80029" width="6" height="19.7259" rx="3" fill="FFFFFF"/>
</svg>    
</div>


            <div class="time-display">
                <span id="time-elapsed"></span><span id="slash-time"></span><span id="time-total"></span>
            </div>
               
    


    <div class="volumecontrol">
    <!-- hljóð táknið -->
        <svg id="volume-btn" width="29" height="23" viewBox="0 0 29 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.895608 12.3709C0.371018 11.9706 0.371017 11.181 0.895607 10.7808L11.3873 2.77639C12.0455 2.27426 12.9939 2.74359 12.9939 3.57143L12.9939 19.5802C12.9939 20.4081 12.0455 20.8774 11.3873 20.3753L0.895608 12.3709Z" fill="#392BFF"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.877 21.8218C19.877 22.5127 20.5445 23.0075 21.1795 22.7353C25.5651 20.8559 28.6374 16.5 28.6374 11.4265C28.6374 6.35301 25.5651 1.99709 21.1795 0.117687C20.5445 -0.154463 19.877 0.340291 19.877 1.03122V1.03122C19.877 1.46428 20.1498 1.84667 20.545 2.02371C24.1359 3.63218 26.6374 7.23721 26.6374 11.4265C26.6374 15.6158 24.1359 19.2208 20.545 20.8293C20.1498 21.0063 19.877 21.3887 19.877 21.8218V21.8218Z" fill="#392BFF"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.5293 18.4084C18.5293 19.1098 19.2081 19.6114 19.8398 19.3065C22.8374 17.8596 24.9054 14.7911 24.9054 11.2396C24.9054 7.68803 22.8374 4.61954 19.8398 3.17263C19.2081 2.86773 18.5293 3.36929 18.5293 4.07068V4.07068C18.5293 4.49911 18.7941 4.87777 19.1736 5.07651C21.3918 6.23805 22.9054 8.56204 22.9054 11.2396C22.9054 13.9171 21.3918 16.2411 19.1736 17.4026C18.7941 17.6013 18.5293 17.98 18.5293 18.4084V18.4084Z" fill="#392BFF"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16.5078 15.5129C16.5078 16.2379 17.2129 16.7542 17.8375 16.3862C19.6297 15.3302 20.8322 13.3804 20.8322 11.1497C20.8322 8.91909 19.6297 6.96931 17.8375 5.9133C17.2129 5.54526 16.5078 6.06158 16.5078 6.78654V6.78654C16.5078 7.20392 16.7556 7.57401 17.0972 7.8139C18.1464 8.55082 18.8322 9.77019 18.8322 11.1497C18.8322 12.5293 18.1464 13.7487 17.0972 14.4856C16.7556 14.7255 16.5078 15.0956 16.5078 15.5129V15.5129Z" fill="#392BFF"/>
            <rect x="0.478516" y="6.25732" width="7.50877" height="10.0117" rx="2" fill="#392BFF"/>
        </svg>
            
    <!-- þögn táknið -->
        <svg id="mute-btn"  width="29" height="23" viewBox="0 0 29 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.895608 12.3714C0.371018 11.9711 0.371017 11.1815 0.895607 10.7813L11.3873 2.77688C12.0455 2.27475 12.9939 2.74408 12.9939 3.57192L12.9939 19.5807C12.9939 20.4086 12.0455 20.8779 11.3873 20.3758L0.895608 12.3714Z" fill="#392BFF"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.877 21.8223C19.877 22.5132 20.5445 23.008 21.1795 22.7358C25.5651 20.8564 28.6374 16.5005 28.6374 11.427C28.6374 6.3535 25.5651 1.99758 21.1795 0.118175C20.5445 -0.153976 19.877 0.340779 19.877 1.0317V1.0317C19.877 1.46477 20.1498 1.84716 20.545 2.0242C24.1359 3.63267 26.6374 7.2377 26.6374 11.427C26.6374 15.6163 24.1359 19.2213 20.545 20.8298C20.1498 21.0068 19.877 21.3892 19.877 21.8223V21.8223Z" fill="#392BFF"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.5293 18.4089C18.5293 19.1103 19.2081 19.6119 19.8398 19.307C22.8374 17.86 24.9054 14.7916 24.9054 11.24C24.9054 7.68852 22.8374 4.62003 19.8398 3.17312C19.2081 2.86822 18.5293 3.36978 18.5293 4.07117V4.07117C18.5293 4.49959 18.7941 4.87825 19.1736 5.07699C21.3918 6.23853 22.9054 8.56253 22.9054 11.24C22.9054 13.9175 21.3918 16.2415 19.1736 17.4031C18.7941 17.6018 18.5293 17.9805 18.5293 18.4089V18.4089Z" fill="#392BFF"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16.5078 15.5129C16.5078 16.2379 17.2129 16.7542 17.8375 16.3862C19.6297 15.3302 20.8322 13.3804 20.8322 11.1497C20.8322 8.91909 19.6297 6.96931 17.8375 5.9133C17.2129 5.54526 16.5078 6.06158 16.5078 6.78654V6.78654C16.5078 7.20392 16.7556 7.57401 17.0972 7.8139C18.1464 8.55082 18.8322 9.77019 18.8322 11.1497C18.8322 12.5293 18.1464 13.7487 17.0972 14.4856C16.7556 14.7255 16.5078 15.0956 16.5078 15.5129V15.5129Z" fill="#392BFF"/>
            <rect x="0.478516" y="6.25781" width="7.50877" height="10.0117" rx="2" fill="#392BFF"/>
            <rect x="3.92383" y="2.89941" width="1.68464" height="30.0835" transform="rotate(-51.7362 3.92383 2.89941)" fill="#392BFF"/>
        </svg>
                                            
        
    <!-- Volume lína -->
    <svg id="volume-bar" width="90" height="7" viewBox="0 0 90 7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="90" height="7" rx="3" fill="#392BFF"/>
    <rect id="volume-fill" x="1.5" y="2" width="3" height="3" rx="1.5" fill="white"/>
    <circle id="volume-knob" cx="1.5" cy="3.5" r="1.5" fill="white"/>
</svg>
            
            </div>
            </div>
    </div>   
</div> 
</div>

  <!-- Hljóð elementið -->
  <audio id="audio-element" preload="auto">
        <source id="audio-source" src="" type="audio/mpeg">
    </audio>
    <?php
    return ob_get_clean(); // Skilar buffered output
}

add_shortcode('saga_player', 'saga_player_shortcode');
?>
