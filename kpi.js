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

  const SESSION_ID_KEY = 'cyber_session_id';

  /**
   * Génère un UUID v4 simple pour identifier la session
   */
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback pour navigateurs plus anciens
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Récupère ou crée l'ID de session anonyme
   */
  function getSessionId() {
    try {
      let sessionId = localStorage.getItem(SESSION_ID_KEY);
      if (!sessionId) {
        sessionId = generateUUID();
        localStorage.setItem(SESSION_ID_KEY, sessionId);
        console.log('[KPI] Nouvelle session créée:', sessionId.substring(0, 8) + '...');
      }
      return sessionId;
    } catch (e) {
      // Si localStorage est bloqué, générer un ID temporaire
      console.warn('[KPI] localStorage indisponible, session temporaire');
      return generateUUID();
    }
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

  function showCyberModal() {
    const modal = document.getElementById('cyber-modal');
    const backdrop = document.getElementById('cyber-backdrop');
    if (!modal || !backdrop) return;
    modal.hidden = false;
    backdrop.hidden = false;
    
    // Envoyer KPI modal_shown
    sendKpi('modal_shown');
    
    const closeBtn = document.getElementById('cyber-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideCyberModal, { once: true });
    }
    backdrop.addEventListener('click', hideCyberModal, { once: true });
  }

  function hideCyberModal() {
    const modal = document.getElementById('cyber-modal');
    const backdrop = document.getElementById('cyber-backdrop');
    if (modal) modal.hidden = true;
    if (backdrop) backdrop.hidden = true;
    
    // Envoyer KPI modal_closed
    sendKpi('modal_closed');
  }

  document.addEventListener('DOMContentLoaded', function () {
    const body = document.body;

    // === LANDING PAGE ===
    if (body.classList.contains('lg-body')) {
      // KPI 1 - Scan du QR code / arrivee sur la landing
      sendKpi('qr_scan');

      // KPI 2 - Clic sur Se connecter avec ENT
      const entButtons = document.querySelectorAll('.js-ent-btn');
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

            // Afficher la modale de sensibilisation (envoie modal_shown)
            showCyberModal();
          }
        });
      }

      // KPI 4 - Clic sur un lien de formation cybersecurite
      const cyberLinks = document.querySelectorAll('.cyber-link');
      cyberLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
          const linkName = link.getAttribute('data-link') || link.href;
          sendKpi('cyber_training_click', { link: linkName });
        });
      });
    }
  });
})();
