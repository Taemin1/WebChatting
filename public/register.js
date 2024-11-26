document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/home.html';
  }
});

// public/register.js
let isIdChecked = false;
let isPasswordMatch = false;

document.getElementById('checkIdButton').addEventListener('click', async () => {
  const id = document.getElementById('registerId').value;
  
  const response = await fetch(`/check-id?id=${id}`);
  const result = await response.json();
  
  if (response.ok) {
    isIdChecked = true;
    document.getElementById('registerMessage').textContent = result.message;
  } else {
    isIdChecked = false;
    document.getElementById('registerMessage').textContent = result.message;
  }
  
  updateSubmitButtonState();
});

// 비밀번호 일치 여부를 검사하는 함수
function checkPasswordMatch() {
  const password1 = document.getElementById('registerPassword1').value;
  const password2 = document.getElementById('registerPassword2').value;
  
  isPasswordMatch = password1 === password2;
  document.getElementById('registerMessage').textContent = isPasswordMatch ? '' : '비밀번호가 일치하지 않습니다.';
  
  updateSubmitButtonState();
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!isIdChecked || !isPasswordMatch) {
    document.getElementById('registerMessage').textContent = 'ID 중복 체크와 비밀번호 일치를 확인하세요.';
    return;
  }

  const id = document.getElementById('registerId').value;
  const password = document.getElementById('registerPassword1').value;

  const response = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password }),
  });

  const result = await response.json();
  if (response.ok) {
    window.location.href = result.redirectTo;
  } else {
    document.getElementById('registerMessage').textContent = result.message;
  }
});

// 버튼 활성화 상태 업데이트
function updateSubmitButtonState() {
  const submitButton = document.getElementById('registerSubmitButton');
  submitButton.disabled = !(isIdChecked && isPasswordMatch);
}
