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

  const seriesPorGrupo = {};
  const volumenPorGrupo = {};
  const ahora = new Date();
  const unaSemanaMs = 7 * 24 * 60 * 60 * 1000;

  historial.forEach(sesion => {
    const fechaSesion = new Date(sesion.fecha);

    if (!ultimaFecha || fechaSesion > new Date(ultimaFecha)) {
      ultimaFecha = sesion.fecha;
    }

    if (ahora - fechaSesion <= unaSemanaMs) {
      sesion.ejercicios.forEach(e => {
        const grupo = e.grupoMuscular || "Otro";
        const series = parseInt(e.series) || 0;
        const repes = parseInt(e.repeticiones) || 0;
        const peso = parseFloat(e.peso) || 0;

        // Sumar series
        seriesPorGrupo[grupo] = (seriesPorGrupo[grupo] || 0) + series;
        totalSeriesSemana += series;

        // Sumar volumen
        volumenPorGrupo[grupo] = (volumenPorGrupo[grupo] || 0) + (series * repes * peso);

        // Peso máximo
        if (peso > pesoMaximo) {
          pesoMaximo = peso;
          ejercicioPesoMax = e.ejercicio;
        }
      });
    }
  });

  // Mostrar peso máximo
  document.getElementById("pesoMaximo").innerHTML = `<strong>${ejercicioPesoMax}</strong><br>${pesoMaximo} kg`;

  // Mostrar último entrenamiento
  if (ultimaFecha) {
    const fechaFormateada = new Date(ultimaFecha).toLocaleDateString();
    const ultimaSesion = historial.find(s => s.fecha === ultimaFecha);
    const primerEjercicio = ultimaSesion?.ejercicios?.[0];
    const infoExtra = primerEjercicio
      ? `${primerEjercicio.ejercicio} - ${primerEjercicio.peso}kg`
      : "Ejercicio no disponible";

    document.getElementById("ultimoEntreno").innerHTML = `
      <strong>${fechaFormateada}</strong><br>${infoExtra}`;
  }

  // Mostrar total de series esta semana
  document.getElementById("seriesSemana").innerHTML = `<strong>${totalSeriesSemana}</strong>`;

  // Mostrar resumen por grupo muscular (series)
  const listaGrupos = document.getElementById("seriesPorGrupo");
  listaGrupos.innerHTML = "";
  for (const grupo in seriesPorGrupo) {
    if (typeof seriesPorGrupo[grupo] !== "number") continue;
    const li = document.createElement("li");
    li.textContent = `${grupo}: ${seriesPorGrupo[grupo]} series`;
    listaGrupos.appendChild(li);
  }

  // Mostrar volumen por grupo muscular
  const listaVolumen = document.getElementById("volumenPorGrupo");
  listaVolumen.innerHTML = "";

  for (const grupo in volumenPorGrupo) {
    if (typeof volumenPorGrupo[grupo] !== "number") continue;
    const li = document.createElement("li");
    li.textContent = `${grupo}: ${volumenPorGrupo[grupo].toLocaleString()} kg totales`;
    listaVolumen.appendChild(li);
  }
});
