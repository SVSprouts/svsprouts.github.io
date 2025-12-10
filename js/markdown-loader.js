// markdown-loader.js
(function () {
  function parseInline(text) {
    // Links: [text](url)
    let result = text.replace(
      /\[([^\]]+)]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Bold: **text**
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

    return result;
  }

  function markdownToHtml(markdown) {
    const lines = markdown.split(/\r?\n/);
    let html = '';
    let inList = false;

    function closeListIfNeeded() {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
    }

    for (let rawLine of lines) {
      const line = rawLine.trimEnd();

      if (!line.trim()) {
        closeListIfNeeded();
        continue;
      }

      // Headings
      const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
      if (headingMatch) {
        closeListIfNeeded();
        const level = headingMatch[1].length;
        const content = parseInline(headingMatch[2].trim());
        html += `<h${level}>${content}</h${level}>`;
        continue;
      }

      // List items
      const listMatch = /^[-*+]\s+(.*)$/.exec(line);
      if (listMatch) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        const content = parseInline(listMatch[1].trim());
        html += `<li>${content}</li>`;
        continue;
      }

      // Paragraph
      closeListIfNeeded();
      html += `<p>${parseInline(line.trim())}</p>`;
    }

    if (inList) {
      html += '</ul>';
    }

    return html;
  }

  async function loadMarkdown(selector, url) {
    const container = document.querySelector(selector);
    if (!container) return;

    // file:// pages cannot fetch local files due to browser CORS restrictions
    if (window.location.protocol === 'file:') {
      console.warn(
        'MarkdownLoader: file:// protocol blocks fetch(). Run a local server, e.g. `python3 -m http.server 8000`, then open http://localhost:8000/course-month1.html'
      );
      container.innerHTML =
        '<p>To view this content, please open the site through http:// or https:// (for example, run <code>python3 -m http.server 8000</code> in the project folder and visit <code>http://localhost:8000/course-month1.html</code>).</p>';
      return;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        container.innerHTML = `<p>Could not load content.</p>`;
        return;
      }
      const text = await res.text();
      container.innerHTML = markdownToHtml(text);
    } catch (err) {
      console.error('Error loading markdown', err);
      container.innerHTML = `<p>Something went wrong loading this content.</p>`;
    }
  }

  window.MarkdownLoader = {
    load,
    markdownToHtml,
  };

  function load(selector, url) {
    return loadMarkdown(selector, url);
  }
})();
