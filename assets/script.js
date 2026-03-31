
(function () {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function safeText(node) {
    return (node && node.textContent ? node.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function inferLineHelp(text, context) {
    const raw = (text || '').trim();
    const lower = raw.toLowerCase();
    if (!raw) {
      return null;
    }

    const isAlgorithm = context === 'algorithm';

    if (isAlgorithm) {
      if (/^si/i.test(raw)) return { title: 'Test conditionnel', role: 'Cette ligne vérifie une condition pour décider quel bloc doit être exécuté.' };
      if (/^sinon si/i.test(raw)) return { title: 'Cas supplémentaire', role: 'Cette ligne ajoute un nouveau test lorsque le premier cas n’a pas été validé.' };
      if (/^sinon/i.test(raw)) return { title: 'Cas contraire', role: 'Cette ligne couvre le cas restant lorsque les conditions précédentes sont fausses.' };
      if (/^pour/i.test(raw)) return { title: 'Boucle contrôlée', role: 'Cette ligne lance une répétition structurée sur un intervalle ou une suite de valeurs.' };
      if (/^tant que/i.test(raw)) return { title: 'Boucle conditionnelle', role: 'Cette ligne répète un traitement tant que la condition reste vraie.' };
      if (/^fin/i.test(raw)) return { title: 'Fin de structure', role: 'Cette ligne marque clairement la fin du bloc logique décrit en algorithmique.' };
      return { title: 'Instruction algorithmique', role: 'Cette ligne décrit une étape de la logique avant la traduction en Python.' };
    }

    if (/^if/.test(lower)) return { title: 'Test conditionnel', role: 'Cette ligne évalue une condition. Si elle est vraie, le bloc indenté sera exécuté.' };
    if (/^elif/.test(lower)) return { title: 'Condition alternative', role: 'Cette ligne ajoute un nouveau test lorsque le premier cas n’a pas été validé.' };
    if (/^else/.test(lower)) return { title: 'Cas par défaut', role: 'Cette ligne introduit le traitement exécuté lorsque les conditions précédentes sont fausses.' };
    if (lower.includes('input(') && lower.includes('int(')) return { title: 'Saisie convertie', role: 'Cette ligne lit une valeur entrée par l’utilisateur puis la convertit en entier pour la comparer correctement.' };
    if (lower.includes('input(')) return { title: 'Saisie utilisateur', role: 'Cette ligne récupère une information entrée par l’utilisateur.' };
    if (lower.includes('print(')) return { title: 'Affichage', role: 'Cette ligne affiche un message ou un résultat pour l’utilisateur.' };
    if (/%\s*2\s*==\s*0/.test(lower)) return { title: 'Test de parité', role: 'Cette ligne vérifie si la valeur est paire en testant si le reste de la division par 2 est nul.' };
    if (/(and|or|not)/.test(lower)) return { title: 'Condition composée', role: 'Cette ligne combine plusieurs tests logiques pour produire une seule décision.' };
    if (/==/.test(raw)) return { title: 'Comparaison d’égalité', role: 'Cette ligne vérifie si deux valeurs sont égales avant de poursuivre le traitement.' };
    if (/[<>!]=?|>=|<=/.test(raw)) return { title: 'Comparaison', role: 'Cette ligne compare des valeurs pour produire une réponse vraie ou fausse.' };
    if (/^[a-zA-Z_][\w]*\s*=/.test(raw) && !/==/.test(raw)) return { title: 'Affectation', role: 'Cette ligne stocke une valeur dans une variable pour l’utiliser ensuite dans le programme.' };
    if (/^case/.test(lower)) return { title: 'Cas ciblé', role: 'Cette ligne traite une valeur précise dans une structure à choix multiple.' };
    if (/^match/.test(lower)) return { title: 'Sélection de cas', role: 'Cette ligne prépare une structure de choix multiple selon une valeur à analyser.' };

    return { title: 'Instruction Python', role: 'Cette ligne participe au déroulement du programme et prépare ou exécute un traitement précis.' };
  }

  function inferBlockHelp(el) {
    if (!el) return null;
    if (el.classList.contains('resultpre')) {
      return {
        title: 'Exemple de résultat attendu',
        role: 'Ce bloc montre le type de sortie que l’on peut observer après l’exécution correcte du programme.'
      };
    }

    const text = safeText(el);
    const classes = el.className || '';
    if (classes.includes('theme-python')) {
      return {
        title: 'Bloc Python',
        role: 'Ce bloc présente une implémentation Python. Survole les lignes pour comprendre le rôle précis de chaque instruction.'
      };
    }
    if (classes.includes('theme-algorithm')) {
      return {
        title: 'Bloc algorithmique',
        role: 'Ce bloc expose la logique en pseudo-code avant ou en parallèle de son implémentation Python.'
      };
    }
    if (el.closest('.syntax-card')) {
      return {
        title: 'Syntaxe à retenir',
        role: 'Ce bloc résume une forme de syntaxe utile à mémoriser pour lire ou écrire correctement la structure étudiée.'
      };
    }
    if (text) {
      return {
        title: 'Bloc technique',
        role: 'Ce bloc technique illustre une syntaxe, un exemple ou un résultat utile pour comprendre la notion étudiée.'
      };
    }
    return null;
  }

  function annotateContextualHelp() {
    const blockSelectors = ['.code-window', '.syntax-card pre', '.resultpre'];
    document.querySelectorAll(blockSelectors.join(',')).forEach((el) => {
      if (!el.dataset.helpTitle || !el.dataset.helpRole) {
        const help = inferBlockHelp(el);
        if (help) {
          el.dataset.helpTitle = help.title;
          el.dataset.helpRole = help.role;
        }
      }
    });

    document.querySelectorAll('.code-window .line').forEach((line) => {
      if (line.dataset.helpTitle && line.dataset.helpRole) return;
      const text = safeText(line.querySelector('.line-text'));
      const codeWindow = line.closest('.code-window');
      const context = codeWindow && codeWindow.classList.contains('theme-algorithm') ? 'algorithm' : 'code';
      const help = inferLineHelp(text, context);
      if (help) {
        line.dataset.helpTitle = help.title;
        line.dataset.helpRole = help.role;
      }
    });

    const tooltip = document.createElement('div');
    tooltip.className = 'code-help-tooltip';
    tooltip.setAttribute('role', 'status');
    tooltip.setAttribute('aria-live', 'polite');
    tooltip.innerHTML = '<p class="code-help-label">Aide contextuelle</p><p class="code-help-title"></p><p class="code-help-role"></p>';
    document.body.appendChild(tooltip);

    const labelEl = tooltip.querySelector('.code-help-title');
    const roleEl = tooltip.querySelector('.code-help-role');
    let activeTarget = null;
    let lastPointer = { x: 24, y: 24 };

    function positionTooltip(x, y) {
      const margin = 12;
      const rect = tooltip.getBoundingClientRect();
      let left = x + 18;
      let top = y + 18;

      if (left + rect.width > window.innerWidth - margin) {
        left = x - rect.width - 18;
      }
      if (left < margin) left = margin;

      if (top + rect.height > window.innerHeight - margin) {
        top = y - rect.height - 18;
      }
      if (top < margin) top = margin;

      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    }

    function showTooltip(target, x, y) {
      if (!target || !target.dataset.helpTitle || !target.dataset.helpRole) return;
      if (activeTarget && activeTarget !== target) {
        activeTarget.classList.remove('help-active');
      }
      activeTarget = target;
      labelEl.textContent = target.dataset.helpTitle;
      roleEl.textContent = target.dataset.helpRole;
      target.classList.add('help-active');
      tooltip.classList.add('is-visible');
      positionTooltip(x, y);
    }

    function hideTooltip(target) {
      const current = target || activeTarget;
      if (current) current.classList.remove('help-active');
      activeTarget = null;
      tooltip.classList.remove('is-visible');
    }

    document.querySelectorAll('[data-help-title][data-help-role]').forEach((target) => {
      target.classList.add('help-target');
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '0');

      target.addEventListener('mouseenter', (event) => {
        lastPointer = { x: event.clientX, y: event.clientY };
        showTooltip(target, event.clientX, event.clientY);
      });

      target.addEventListener('mousemove', (event) => {
        lastPointer = { x: event.clientX, y: event.clientY };
        if (tooltip.classList.contains('is-visible')) {
          positionTooltip(event.clientX, event.clientY);
        }
      });

      target.addEventListener('mouseleave', () => hideTooltip(target));
      target.addEventListener('focus', () => {
        const rect = target.getBoundingClientRect();
        const x = Math.min(rect.left + rect.width / 2, window.innerWidth - 20);
        const y = Math.min(rect.top + 16, window.innerHeight - 20);
        lastPointer = { x, y };
        showTooltip(target, x, y);
      });
      target.addEventListener('blur', () => hideTooltip(target));
    });

    window.addEventListener('scroll', () => {
      if (tooltip.classList.contains('is-visible')) {
        positionTooltip(lastPointer.x, lastPointer.y);
      }
    }, { passive: true });
  }

  function initQcm() {
    const qcmRoot = document.getElementById('qcmFinal');
    const qcmSection = document.getElementById('qcm-final');
    const overlay = document.getElementById('qcmOverlay');
    if (!qcmRoot || !qcmSection || !overlay) return;

    const submitButton = qcmRoot.querySelector('.qcm-submit');
    const modal = overlay.querySelector('.qcm-modal');
    const modalLabel = overlay.querySelector('.qcm-modal-label');
    const modalTitle = overlay.querySelector('.qcm-modal-title');
    const modalText = overlay.querySelector('.qcm-modal-text');
    const hintsWrap = overlay.querySelector('.qcm-modal-hints');
    const hintsList = overlay.querySelector('.qcm-hints');
    const retryButton = overlay.querySelector('.qcm-retry');
    const closeButton = overlay.querySelector('.qcm-close');
    const questions = Array.from(qcmRoot.querySelectorAll('.qcm-question'));

    questions.forEach((question) => {
      question.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener('change', () => {
          question.querySelectorAll('.qcm-option').forEach((label) => label.classList.remove('is-selected'));
          const label = input.closest('.qcm-option');
          if (label) label.classList.add('is-selected');
        });
      });
    });

    function openOverlay(type, score, hints) {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      modal.classList.remove('success', 'failure');
      modal.classList.add(type);

      if (type === 'success') {
        modalLabel.textContent = 'Validation réussie';
        modalTitle.textContent = 'Bravo';
        modalText.textContent = 'Tu as obtenu ' + score + ' bonnes réponses sur 10. La leçon est validée et tu peux poursuivre avec confiance.';
        hintsWrap.hidden = true;
        hintsList.innerHTML = '';
        retryButton.hidden = true;
        closeButton.textContent = 'Fermer';
      } else {
        modalLabel.textContent = 'Validation à reprendre';
        modalTitle.textContent = 'Résultat du QCM';
        modalText.textContent = 'Le nombre de tes réponses correctes était insuffisant : ' + score + ' sur 10. Relis les parties indiquées puis recommence.';
        hintsWrap.hidden = false;
        hintsList.innerHTML = '';
        hints.slice(0, 5).forEach((hint) => {
          const li = document.createElement('li');
          li.textContent = hint;
          hintsList.appendChild(li);
        });
        retryButton.hidden = false;
        closeButton.textContent = 'Fermer';
      }

      (type === 'success' ? closeButton : retryButton).focus();
    }

    function closeOverlay() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
    }

    function resetQcm() {
      questions.forEach((question) => {
        question.querySelectorAll('input[type="radio"]').forEach((input) => {
          input.checked = false;
        });
        question.querySelectorAll('.qcm-option').forEach((label) => label.classList.remove('is-selected'));
      });
      closeOverlay();
      qcmSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        const firstInput = qcmRoot.querySelector('input[type="radio"]');
        if (firstInput) firstInput.focus();
      }, 250);
    }

    if (submitButton) {
      submitButton.addEventListener('click', () => {
        let score = 0;
        const hints = [];
        questions.forEach((question) => {
          const correct = question.dataset.correct;
          const selected = question.querySelector('input[type="radio"]:checked');
          if (selected && selected.value === correct) {
            score += 1;
          } else {
            const hint = question.dataset.hint;
            if (hint && !hints.includes(hint)) hints.push(hint);
          }
        });

        openOverlay(score >= 6 ? 'success' : 'failure', score, hints);
      });
    }

    if (retryButton) {
      retryButton.addEventListener('click', resetQcm);
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => {
        closeOverlay();
        if (submitButton) submitButton.focus();
      });
    }

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeOverlay();
        if (submitButton) submitButton.focus();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeOverlay();
        if (submitButton) submitButton.focus();
      }
    });
  }

  onReady(function () {
    const exportButton = document.getElementById('exportPdf');
    if (exportButton) {
      exportButton.addEventListener('click', function () { window.print(); });
    }
    annotateContextualHelp();
    initQcm();
  });
})();
