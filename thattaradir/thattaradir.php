<?php
/*
Plugin Name: Þáttaraðir
Description: Viðbót sem sækir lista af þáttum
Version: 1.0
Author: Útvarp Saga
*/

function thattaradir_enqueue_scripts() {
    // Hleð inn scripts.js fyrir þáttaraðir
    wp_enqueue_script('thattaradir-script', plugin_dir_url(__FILE__) . 'scripts.js', array(), null, true);
    
    // Hleð inn saga-player.js, leiðrétt slóðina ef viðbótin er staðsett annars staðar
    wp_enqueue_script('saga-player-script', plugin_dir_url(__DIR__) . '/saga-player/saga-player.js', array(), null, true);
    
    // Hleð inn stílsniði fyrir þáttaraðir
    wp_enqueue_style('thattaradir-style', plugin_dir_url(__FILE__) . 'styles.css');
}


add_action('wp_enqueue_scripts', 'thattaradir_enqueue_scripts');

function thattaradir() {
    ob_start(); ?>
    <div id="thattaradir-listi">
        <section id="thattaradir-episodes">
            <h2>Nýjustu Þættir</h2>
            <ul id="episode-list"></ul>
        </section>
   
    </div>
    <?php return ob_get_clean();

}

add_shortcode('thattaradir_listi', 'thattaradir');
?>
