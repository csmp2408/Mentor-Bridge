/**
 * MentorBridge - Feedback system
 * Modal for mentee-to-mentor and mentor-to-mentee feedback (ratings + comments).
 * Triggered after mentor-mentee match and upon roadmap completion.
 */

(function() {
  let currentOptions = null;
  let selectedRating = 0;

  function getModalContainer() {
    let el = document.getElementById('feedbackModalContainer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'feedbackModalContainer';
      el.className = 'feedback-overlay hidden';
      document.body.appendChild(el);
    }
    return el;
  }

  function renderModal() {
    const opts = currentOptions;
    if (!opts) return;
    const isMenteeToMentor = opts.type === 'mentee-to-mentor';
    const title = isMenteeToMentor
      ? 'Rate your mentor'
      : 'Rate your mentee';
    const subtitle = isMenteeToMentor
      ? 'How was your experience with ' + (opts.partnerName || 'your mentor') + '?'
      : 'How was ' + (opts.partnerName || 'your mentee') + "'s progress?";
    const triggerLabel = opts.trigger === 'roadmap-complete' ? ' (Roadmap completed)' : ' (New match)';

    selectedRating = 0;
    const container = getModalContainer();
    container.className = 'feedback-overlay';
    container.innerHTML = `
      <div class="feedback-modal">
        <h3>${title}${triggerLabel}</h3>
        <p class="feedback-subtitle">${subtitle}</p>
        <label style="display:block; margin-bottom: 0.35rem; font-weight: 500;">Rating (1-5 stars)</label>
        <div class="feedback-stars" id="feedbackStars">
          <button type="button" data-rating="1">★</button>
          <button type="button" data-rating="2">★</button>
          <button type="button" data-rating="3">★</button>
          <button type="button" data-rating="4">★</button>
          <button type="button" data-rating="5">★</button>
        </div>
        <label style="display:block; margin-bottom: 0.35rem; font-weight: 500;">Comment (optional)</label>
        <textarea id="feedbackComment" placeholder="Share your feedback..."></textarea>
        <div class="feedback-modal-actions">
          <button type="button" class="btn btn-secondary" id="feedbackSkip">Skip</button>
          <button type="button" class="btn btn-primary" id="feedbackSubmit">Submit</button>
        </div>
      </div>
    `;

    container.querySelectorAll('#feedbackStars button').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRating = parseInt(btn.dataset.rating);
        container.querySelectorAll('#feedbackStars button').forEach(b => b.classList.remove('active'));
        container.querySelectorAll('#feedbackStars button').forEach(b => {
          if (parseInt(b.dataset.rating) <= selectedRating) b.classList.add('active');
        });
      });
    });

    container.querySelector('#feedbackSkip').addEventListener('click', () => {
      container.className = 'feedback-overlay hidden';
      currentOptions = null;
    });

    container.querySelector('#feedbackSubmit').addEventListener('click', () => {
      if (selectedRating < 1) {
        alert('Please select a rating (1-5 stars).');
        return;
      }
      const comment = (container.querySelector('#feedbackComment').value || '').trim();
      if (typeof api !== 'undefined' && api.submitFeedback && opts.fromUserId && opts.toUserId && opts.type) {
        api.submitFeedback(opts.fromUserId, opts.toUserId, opts.type, selectedRating, comment, opts.trigger || null)
          .then(() => {
            container.className = 'feedback-overlay hidden';
            currentOptions = null;
            alert('Thank you for your feedback!');
          })
          .catch(err => {
            alert(err.message || 'Failed to submit feedback.');
          });
      } else {
        container.className = 'feedback-overlay hidden';
        currentOptions = null;
      }
    });
  }

  /**
   * Show the feedback modal.
   * @param {Object} options - { fromUserId, toUserId, type: 'mentee-to-mentor'|'mentor-to-mentee', partnerName, trigger: 'match'|'roadmap-complete' }
   */
  window.showFeedbackModal = function(options) {
    if (!options || !options.fromUserId || !options.toUserId || !options.type) return;
    currentOptions = options;
    renderModal();
  };

  window.hideFeedbackModal = function() {
    const el = document.getElementById('feedbackModalContainer');
    if (el) el.className = 'feedback-overlay hidden';
    currentOptions = null;
  };
})();
