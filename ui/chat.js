// Chat UI module
export function addChatMessage(container, author, message) {
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<span class="chat-author">${escapeHtml(author)}:</span> ${escapeHtml(message)}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

export function addSystemMessage(container, message) {
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.style.color = 'var(--copper-light)';
  div.style.fontStyle = 'italic';
  div.textContent = message;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// Update the game log
export function updateGameLog(container, logEntries) {
  container.innerHTML = '';
  // Show last 30 entries
  const recent = logEntries.slice(-30);
  recent.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.textContent = entry;
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
