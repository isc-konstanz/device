<?php
    global $user, $session;

    $domain = "messages";
    bindtextdomain($domain, "Modules/device/locale");
    bind_textdomain_codeset($domain, 'UTF-8');

    $view = $user->get_preferences($session['userid'], 'deviceView');
    if (!isset($view) || !$view) {
         $menu_dropdown_config[] = array(
             'name'=> dgettext($domain, "Device Setup"),
             'icon'=>'icon-home',
             'path'=>"device/view" ,
             'session'=>"write",
             'order' => 45
         );
    }

    $menu_dropdown[] = array(
        'name'=> dgettext($domain, "Things"),
        'icon'=>'icon-tasks',
        'path'=>"device/thing/view" ,
        'session'=>"write",
        'order' => 10
    );
