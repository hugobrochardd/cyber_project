/**
 * KPI Tracking - Projet de sensibilisation cybersecurite
 * Universite de Corse + Crous de Corse
 *
 * KPIs suivis et enregistrés dans Neon (Netlify DB) :
 *   - qr_scan              : arrivee sur la landing (scan du QR code)
 *   - ent_button_click     : clic sur Se connecter avec ENT
 *   - start_typing         : debut de saisie (>=3 caracteres) sur le faux ENT
 *   - modal_shown          : affichage de la modale de sensibilisation
 *   - modal_closed         : fermeture de la modale
 *   - cyber_training_click : clic sur un lien de formation cybersecurite
 */
(function () {
  'use strict';

  var SESSION_ID_KEY = 'cyber_session_id';
  var COOKIE_NAME = 'cyber_uid';
  var COOKIE_DAYS = 365;

  /**
   * Génère un UUID v4 simple pour identifier la session
   */
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback pour navigateurs plus anciens
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Définit un cookie
   */
  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
  }

  /**
   * Récupère un cookie
   */
  function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Récupère ou crée l'ID de session anonyme (localStorage + Cookie)
   */
  function getSessionId() {
    var sessionId = null;
    
    // 1. Essayer de récupérer depuis le cookie (plus fiable pour les utilisateurs uniques)
    sessionId = getCookie(COOKIE_NAME);
    
    // 2. Sinon, essayer localStorage
    if (!sessionId) {
      try {
        sessionId = localStorage.getItem(SESSION_ID_KEY);
      } catch (e) {}
    }
    
    // 3. Si toujours rien, créer un nouveau
    if (!sessionId) {
      sessionId = generateUUID();
      console.log('[KPI] Nouvelle session créée:', sessionId.substring(0, 8) + '...');
    }
    
    // 4. Sauvegarder dans les deux endroits
    setCookie(COOKIE_NAME, sessionId, COOKIE_DAYS);
    try {
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    } catch (e) {}
    
    return sessionId;
  }

  /**
   * Envoie un événement KPI vers la Netlify Function
   * @param {string} type - Type d'événement (qr_scan, ent_button_click, etc.)
   * @param {object} extra - Données supplémentaires optionnelles
   */
  async function sendKpi(type, extra = {}) {
    if (!type) {
      console.warn('[KPI] Type d\'événement manquant');
      return;
    }

    try {
      const payload = {
        type: type,
        sessionId: getSessionId(),
        page: window.location.pathname,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
        deviceType: /Mobi/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        language: navigator.language || null,
        extra: Object.keys(extra).length > 0 ? extra : null
      };

      console.log('[KPI] Envoi événement:', type, extra);

      const response = await fetch('/.netlify/functions/kpi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('[KPI] Erreur serveur:', response.status);
      } else {
        console.log('[KPI] Événement enregistré:', type);
      }
    } catch (error) {
      // Ne pas casser l'UX si l'envoi échoue
      console.error('[KPI] Erreur lors de l\'envoi:', error);
    }
  }

  // Exposer l'API publique
  window.CyberKPI = {
    sendKpi: sendKpi,
    getSessionId: getSessionId
  };

  /**
   * Affiche l'écran de "piratage" effrayant puis la modale
   */
  function showHackScreen() {
    // Créer l'écran de piratage s'il n'existe pas
    var hackScreen = document.getElementById('hack-screen');
    if (!hackScreen) {
      hackScreen = document.createElement('div');
      hackScreen.id = 'hack-screen';
      hackScreen.innerHTML = [
        '<div class="hack-content">',
        '  <div class="hack-icon">⚠️</div>',
        '  <div class="hack-glitch" data-text="SYSTÈME COMPROMIS">SYSTÈME COMPROMIS</div>',
        '  <div class="hack-text">Tentative de connexion détectée...</div>',
        '  <div class="hack-loader"></div>',
        '</div>'
      ].join('\n');
      document.body.appendChild(hackScreen);
    }
    
    hackScreen.classList.add('active');
    
    // Afficher une fausse alerte système après 500ms
    setTimeout(function() {
      alert('⚠️ ALERTE SÉCURITÉ ⚠️\n\nVotre système a détecté une tentative de phishing.\n\nVos identifiants auraient pu être volés !');
      
      // Après l'alerte, masquer l'écran de hack et afficher la vraie modale
      setTimeout(function() {
        hackScreen.classList.remove('active');
        showCyberModal();
      }, 300);
    }, 1500);
  }

  function showCyberModal() {
    var modal = document.getElementById('cyber-modal');
    var backdrop = document.getElementById('cyber-backdrop');
    if (!modal || !backdrop) return;
    modal.hidden = false;
    backdrop.hidden = false;
    
    // Envoyer KPI modal_shown
    sendKpi('modal_shown');
    
    var closeBtn = document.getElementById('cyber-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideCyberModal, { once: true });
    }
    backdrop.addEventListener('click', hideCyberModal, { once: true });
  }

  function hideCyberModal() {
    var modal = document.getElementById('cyber-modal');
    var backdrop = document.getElementById('cyber-backdrop');
    if (modal) modal.hidden = true;
    if (backdrop) backdrop.hidden = true;
    
    // Envoyer KPI modal_closed
    sendKpi('modal_closed');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;

    // === LANDING PAGE ===
    if (body.classList.contains('lg-body')) {
      // KPI 1 - Scan du QR code / arrivee sur la landing
      sendKpi('qr_scan');

      // KPI 2 - Clic sur Se connecter avec ENT
      var entButtons = document.querySelectorAll('.js-ent-btn');
      entButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          sendKpi('ent_button_click');
        });
      });
    }

    // === PAGE ENT (faux ENT) ===
    if (body.classList.contains('auth-body')) {
      var usernameInput = document.getElementById('username');
      var form = document.querySelector('.auth-form');
      var typingTracked = false;

      // Cacher la modale au demarrage
      hideCyberModal();

      // KPI 3 - Debut de saisie (>=3 caracteres) dans le champ identifiant
      // Utiliser 'input' au lieu de 'keydown' pour compatibilite Android
      if (usernameInput) {
        usernameInput.addEventListener('input', function (e) {
          if (typingTracked) {
            return;
          }

          // Declencher quand au moins 3 caracteres sont saisis
          if (usernameInput.value.length >= 3) {
            typingTracked = true;
            sendKpi('start_typing');

            // Desactiver le formulaire (inputs + boutons)
            if (form) {
              Array.from(form.elements).forEach(function (el) {
                if (el.tagName === 'INPUT' || el.tagName === 'BUTTON') {
                  el.disabled = true;
                }
              });
            }

            // Afficher l'écran de piratage puis la modale
            showHackScreen();
          }
        });
      }

      // KPI 4 - Clic sur un lien de formation cybersecurite
      var cyberLinks = document.querySelectorAll('.cyber-link');
      cyberLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
          var linkName = link.getAttribute('data-link') || link.href;
          sendKpi('cyber_training_click', { link: linkName });
        });
      });
    }
  });
})();
