document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/home.html';
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('loginId').value;
  const password = document.getElementById('loginPassword').value;

  const response = await fetch(`/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password }),
  });

  const result = await response.json();
  if (response.ok) {
    localStorage.setItem('token', result.token);
    window.location.href = result.redirectTo;
  } else {
    document.getElementById('loginMessage').textContent = result.message;
  }
});