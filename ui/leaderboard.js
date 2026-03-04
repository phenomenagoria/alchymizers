// Render the leaderboard
export function renderLeaderboard(container, entries, selfId) {
  container.innerHTML = '';

  entries.forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'lb-entry';

    const rank = document.createElement('span');
    rank.className = 'lb-rank';
    rank.textContent = idx + 1;
    div.appendChild(rank);

    const name = document.createElement('span');
    name.className = 'lb-name';
    if (entry.id === selfId) name.classList.add('self');
    name.textContent = entry.name;
    if (entry.blownOut) name.textContent += ' 💥';
    else if (entry.stopped) name.textContent += ' ✋';
    div.appendChild(name);

    const stats = document.createElement('span');
    stats.className = 'lb-stats';
    stats.innerHTML = `
      <span class="lb-rep">★${entry.reputation}</span>
      <span class="lb-dollars">$${entry.dollars}</span>
      <span>P${entry.position}</span>
    `;
    div.appendChild(stats);

    container.appendChild(div);
  });
}
