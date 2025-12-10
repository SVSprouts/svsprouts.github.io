// course-page.js
(function () {
  const STORAGE_KEY_PREFIX = 'youngpreneur-month-';

  document.addEventListener('DOMContentLoaded', async () => {
    const month = document.body.dataset.month;
    if (!month) return;

    // 1. Load markdown
    const mdPath = `content/month${month}.md`;
    await window.MarkdownLoader.load('#course-content', mdPath);

    // 2. Add week completion buttons
    const weeks = initWeekButtons(month);

    // 3. Build table of contents
    buildToc();

    // 4. Init progress from localStorage
    initProgress(month, weeks);

    // 5. Wire "mark complete" button
    const completeBtn = document.getElementById('mark-complete');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => toggleComplete(month, weeks));
    }
  });

  function buildToc() {
    const content = document.getElementById('course-content');
    const tocContainer = document.getElementById('course-toc');
    if (!content || !tocContainer) return;

    const headings = content.querySelectorAll('h2, h3');
    if (!headings.length) {
      tocContainer.innerHTML = '<p>No sections yet.</p>';
      return;
    }

    const ul = document.createElement('ul');

    headings.forEach((heading) => {
      const level = heading.tagName.toLowerCase();
      const text = heading.textContent.trim();
      if (!heading.id) {
        heading.id = text.toLowerCase().replace(/[^\w]+/g, '-');
      }

      const li = document.createElement('li');
      if (level === 'h3') {
        li.style.paddingLeft = '0.75rem';
        li.style.fontSize = '0.8rem';
      }

      const a = document.createElement('a');
      a.href = `#${heading.id}`;
      a.textContent = text;

      li.appendChild(a);
      ul.appendChild(li);
    });

    tocContainer.innerHTML = '';
    tocContainer.appendChild(ul);
  }

  function initProgress(month, weeks) {
    const monthStored = localStorage.getItem(STORAGE_KEY_PREFIX + month) === 'complete';

    // Back-compat: if the old month-level flag is set, mirror it into all weeks
    if (monthStored && weeks.length) {
      weeks.forEach(({ weekNumber }) => setWeekComplete(month, weekNumber, true));
    }

    updateProgressFromWeeks(month, weeks);
    updateButtonState(month, weeks);
  }

  function toggleComplete(month, weeks) {
    const totalWeeks = weeks.length;

    if (totalWeeks) {
      const completedWeeks = countCompletedWeeks(month, weeks);
      const willComplete = completedWeeks !== totalWeeks;

      weeks.forEach(({ weekNumber }) => setWeekComplete(month, weekNumber, willComplete));
      if (willComplete) {
        localStorage.setItem(STORAGE_KEY_PREFIX + month, 'complete');
      } else {
        localStorage.removeItem(STORAGE_KEY_PREFIX + month);
      }

      updateProgressFromWeeks(month, weeks);
      updateButtonState(month, weeks);
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + month);
    const isComplete = stored === 'complete';
    const nextState = isComplete ? null : 'complete';

    if (nextState) {
      localStorage.setItem(STORAGE_KEY_PREFIX + month, nextState);
    } else {
      localStorage.removeItem(STORAGE_KEY_PREFIX + month);
    }

    updateProgress(nextState ? 100 : 0);
    updateButtonState(month, weeks);
  }

  function updateProgressFromWeeks(month, weeks) {
    if (!weeks.length) {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + month);
      const percent = stored === 'complete' ? 100 : 0;
      updateProgress(percent);
      return;
    }

    const total = weeks.length;
    const completed = countCompletedWeeks(month, weeks);
    const percent = Math.round((completed / total) * 100);
    updateProgress(percent, { completed, total });
  }

  function updateProgress(percent, info) {
    const bar = document.querySelector('.course-progress-bar');
    const label = document.querySelector('.course-progress-label');
    const container = document.querySelector('.course-progress');

    if (!bar || !label || !container) return;

    bar.style.width = `${percent}%`;
    label.textContent = info && info.total
      ? `${percent}% complete (${info.completed}/${info.total} weeks)`
      : `${percent}% complete`;
    container.setAttribute('aria-valuenow', String(percent));
  }

  function updateButtonState(month, weeks) {
    const btn = document.getElementById('mark-complete');
    if (!btn) return;

    const isComplete = weeks.length
      ? countCompletedWeeks(month, weeks) === weeks.length
      : localStorage.getItem(STORAGE_KEY_PREFIX + month) === 'complete';

    if (isComplete) {
      btn.textContent = 'Mark as not complete';
    } else {
      btn.textContent = 'Mark this month as complete';
    }
  }

  function initWeekButtons(month) {
    const content = document.getElementById('course-content');
    if (!content) return [];

    const headings = Array.from(content.querySelectorAll('h3'));
    const weeks = [];

    headings.forEach((heading, index) => {
      const match = heading.textContent.match(/Week\s+(\d+)/i);
      const weekNumber = match ? Number(match[1]) : index + 1;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'primary-button week-complete-button';

      const isComplete = isWeekComplete(month, weekNumber);
      setWeekButtonText(btn, weekNumber, isComplete);

      btn.addEventListener('click', () => {
        const nextState = !isWeekComplete(month, weekNumber);
        setWeekComplete(month, weekNumber, nextState);
        setWeekButtonText(btn, weekNumber, nextState);
        updateProgressFromWeeks(month, weeks);
        updateButtonState(month, weeks);
      });

      heading.insertAdjacentElement('afterend', btn);

      // Add notes box for the week
      const noteBlock = document.createElement('div');
      noteBlock.className = 'week-note-block';
      const noteLabel = document.createElement('label');
      noteLabel.className = 'week-note-label';
      noteLabel.textContent = `Notes for Week ${weekNumber}`;
      noteLabel.setAttribute('for', `week-note-${weekNumber}`);
      const noteArea = document.createElement('textarea');
      noteArea.className = 'week-note-textarea';
      noteArea.id = `week-note-${weekNumber}`;
      noteArea.rows = 4;
      noteArea.placeholder = 'Jot down your ideas, reflections, or next steps...';
      noteArea.value = getWeekNote(month, weekNumber);
      noteArea.addEventListener('input', () => {
        setWeekNote(month, weekNumber, noteArea.value);
      });

      noteBlock.appendChild(noteLabel);
      noteBlock.appendChild(noteArea);
      btn.insertAdjacentElement('afterend', noteBlock);
      weeks.push({ weekNumber, button: btn });
    });

    return weeks;
  }

  function setWeekButtonText(btn, weekNumber, isComplete) {
    btn.textContent = isComplete
      ? `Mark Week ${weekNumber} as not complete`
      : `Mark Week ${weekNumber} as complete`;
  }

  function setWeekComplete(month, weekNumber, isComplete) {
    const key = `${STORAGE_KEY_PREFIX}${month}-week-${weekNumber}`;
    if (isComplete) {
      localStorage.setItem(key, 'complete');
    } else {
      localStorage.removeItem(key);
    }
  }

  function isWeekComplete(month, weekNumber) {
    const key = `${STORAGE_KEY_PREFIX}${month}-week-${weekNumber}`;
    return localStorage.getItem(key) === 'complete';
  }

  function setWeekNote(month, weekNumber, text) {
    const key = `${STORAGE_KEY_PREFIX}${month}-week-${weekNumber}-note`;
    if (text && text.trim()) {
      localStorage.setItem(key, text);
    } else {
      localStorage.removeItem(key);
    }
  }

  function getWeekNote(month, weekNumber) {
    const key = `${STORAGE_KEY_PREFIX}${month}-week-${weekNumber}-note`;
    return localStorage.getItem(key) || '';
  }

  function countCompletedWeeks(month, weeks) {
    return weeks.reduce(
      (acc, { weekNumber }) => acc + (isWeekComplete(month, weekNumber) ? 1 : 0),
      0
    );
  }
})();
