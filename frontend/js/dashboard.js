document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  const claveHistorial = "historial_" + usuario.nombre.toLowerCase();
  const historial = JSON.parse(localStorage.getItem(claveHistorial)) || [];

  const saludo = document.querySelector("h1");
  if (saludo) {
    saludo.innerHTML = `Hola, ${usuario.nombre}!<br>Domina tus límites cada repetición.`;
  }

  if (historial.length === 0) return;

  let pesoMaximo = 0;
  let ejercicioPesoMax = "N/A";
  let totalSeriesSemana = 0;
  let ultimaFecha = null;

  const ahora = new Date();
  const unaSemanaMs = 7 * 24 * 60 * 60 * 1000;

  historial.forEach(sesion => {
    const fechaSesion = new Date(sesion.fecha);

    // ✅ CORRECTA MANERA DE ACTUALIZAR FECHA MÁS RECIENTE
    if (!ultimaFecha || fechaSesion > new Date(ultimaFecha)) {
      ultimaFecha = sesion.fecha;
    }

    sesion.ejercicios.forEach(e => {
      if (e.peso > pesoMaximo) {
        pesoMaximo = e.peso;
        ejercicioPesoMax = e.ejercicio;
      }

      if (ahora - fechaSesion <= unaSemanaMs) {
        totalSeriesSemana += parseInt(e.series) || 0;
      }
    });
  });

  // Mostrar resultados
  document.getElementById("pesoMaximo").innerHTML = `<strong>${ejercicioPesoMax}</strong><br>${pesoMaximo} kg`;

  if (ultimaFecha) {
    const fechaFormateada = new Date(ultimaFecha).toLocaleDateString();
    document.getElementById("ultimoEntreno").innerHTML = `
      <strong>${fechaFormateada}</strong><br>Última sesión registrada`;
  }

  document.getElementById("seriesSemana").innerHTML = `<strong>${totalSeriesSemana}</strong>`;
});
