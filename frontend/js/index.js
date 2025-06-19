document.addEventListener("DOMContentLoaded", () => {
  const sesion = sessionStorage.getItem("usuario");
  if (sesion) {
    window.location.href = "../html/Dashboard.html";
  }
});

