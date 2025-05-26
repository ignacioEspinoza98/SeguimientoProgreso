document.addEventListener("DOMContentLoaded", () => {
  const sesion = sessionStorage.getItem("usuario");
  if (sesion) {
    window.location.href = "pages/Dashboard.html";
  }
});

