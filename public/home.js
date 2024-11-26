document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const response = await fetch('/home', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('userId', data.id);
  } else {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  }
});

document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
});
