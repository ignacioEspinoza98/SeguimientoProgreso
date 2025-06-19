const Logueado = sessionStorage.getItem("Logueado");

if (!Logueado) {
  window.location.href = "../index.html";
}
