const display = document.getElementById("display");

function appendToDisplay(input) {
  display.textContent += input;
}

function clearDisplay() {
  display.textContent = "";
}

function calculate() {
  try {
    display.textContent = eval(display.textContent);
  } catch (error) {
    display.textContent = "Error";
  }
}

document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('click', () => {
    const value = button.getAttribute('data-value');
    if (value === 'C') {
      clearDisplay();
    } else if (value === '=') {
      calculate();
    } else {
      appendToDisplay(value);
    }
  });
});
