document.addEventListener("DOMContentLoaded", () => {
  const botonCerrar = document.getElementById("cerrarSesion");
  if (botonCerrar) {
    botonCerrar.addEventListener("click", () => {
      sessionStorage.clear();
      alert("Sesión cerrada correctamente");
      window.location.href = "../index.html"; // sube un nivel
    });
  }
});

