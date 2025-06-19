document.addEventListener("DOMContentLoaded", async () => {
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));
  if (!usuario) {
    window.location.href = "../html/InicioSesion.html";
    return;
  }

  const saludo = document.getElementById("saludoUsuario");
  const nombre = usuario.nombre || usuario.usuario || usuario.email || "usuario";
  saludo.textContent = `¡Hola, ${nombre}!`;

  const obtenerHistorial = window.firebaseServices?.obtenerHistorial;
  if (typeof obtenerHistorial !== "function") {
    console.error("No se puede acceder a obtenerHistorial");
    return;
  }

  let historial = [];
  try {
    historial = await obtenerHistorial(usuario.uid);
  } catch (e) {
    console.error("Error al obtener historial:", e);
    return;
  }

  if (!Array.isArray(historial) || historial.length === 0) {
    document.getElementById("fechaUltimaSesion").textContent = "Sin sesiones";
    return;
  }

  historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const ultimaSesion = historial[0];

  const ejerciciosRealizados = ultimaSesion.ejercicios.length;
  let seriesTotales = 0;
  let volumenTotal = 0;
  let pesoMaximo = 0;
  let ejercicioPesoMax = "-";
  const seriesPorGrupo = {};
  const volumenPorGrupo = {};

  const ahora = new Date();
  const unaSemanaMs = 7 * 24 * 60 * 60 * 1000;
  const hace7dias = new Date(ahora.getTime() - unaSemanaMs);
  const hace14dias = new Date(ahora.getTime() - 2 * unaSemanaMs);

  let seriesSemanaActual = 0;
  let seriesSemanaAnterior = 0;

  historial.forEach(sesion => {
    const fechaSesion = new Date(sesion.fecha);
    const enSemanaActual = fechaSesion >= hace7dias;
    const enSemanaAnterior = fechaSesion >= hace14dias && fechaSesion < hace7dias;

    sesion.ejercicios.forEach(ej => {
      const grupo = ej.grupo || "Otro";
      ej.series.forEach(s => {
        const peso = parseFloat(s.peso) || 0;
        const repes = parseInt(s.repeticiones) || 0;

        const volumen = peso * repes;
        volumenTotal += volumen;
        seriesTotales += 1;

        if (peso > pesoMaximo) {
          pesoMaximo = peso;
          ejercicioPesoMax = ej.nombre;
        }

        if (enSemanaActual) {
          seriesSemanaActual++;
          seriesPorGrupo[grupo] = (seriesPorGrupo[grupo] || 0) + 1;
          volumenPorGrupo[grupo] = (volumenPorGrupo[grupo] || 0) + volumen;
        } else if (enSemanaAnterior) {
          seriesSemanaAnterior++;
        }
      });
    });
  });

  const nombreUltimoEjercicio = ultimaSesion.ejercicios[ultimaSesion.ejercicios.length - 1]?.nombre || "-";
  const fechaUltima = new Date(ultimaSesion.fecha).toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric"
  });

  document.getElementById("fechaUltimaSesion").textContent = fechaUltima;
  document.getElementById("ejerciciosUltimaSesion").textContent = ejerciciosRealizados;
  document.getElementById("seriesUltimaSesion").textContent = seriesTotales;
  document.getElementById("volumenUltimaSesion").textContent = volumenTotal.toFixed(2) + " kg";

  document.getElementById("pesoMaximo").textContent = `${ejercicioPesoMax} - ${pesoMaximo} kg`;

  const diferencia = seriesSemanaActual - seriesSemanaAnterior;
  const comparacion = document.getElementById("comparacionSemanal");
  if (comparacion) {
    if (diferencia > 0) {
      comparacion.textContent = `+${diferencia} series respecto a la semana pasada`;
    } else if (diferencia < 0) {
      comparacion.textContent = `${diferencia} series respecto a la semana pasada`;
    } else {
      comparacion.textContent = `⚖️ Mismo número de series que la semana pasada`;
    }
  }

  const listaGrupos = document.getElementById("seriesPorGrupo");
  if (listaGrupos) {
    listaGrupos.innerHTML = "";
    for (const grupo in seriesPorGrupo) {
      const li = document.createElement("li");
      li.textContent = `${grupo}: ${seriesPorGrupo[grupo]} series`;
      listaGrupos.appendChild(li);
    }
  }

  const listaVolumen = document.getElementById("volumenPorGrupo");
  if (listaVolumen) {
    listaVolumen.innerHTML = "";
    for (const grupo in volumenPorGrupo) {
      const li = document.createElement("li");
      li.textContent = `${grupo}: ${volumenPorGrupo[grupo].toLocaleString()} kg`;
      listaVolumen.appendChild(li);
    }
  }

  const grupoMas = Object.entries(seriesPorGrupo).reduce((max, [grupo, series]) => {
    return series > max.series ? { grupo, series } : max;
  }, { grupo: "-", series: 0 });

  const grupoMasElem = document.getElementById("grupoMasTrabajado");
  if (grupoMasElem) {
    grupoMasElem.textContent = `${grupoMas.grupo} (${grupoMas.series} series)`;
  } else {
    console.warn("Elemento grupoMasTrabajado no encontrado en el DOM");
  }

  const hace30dias = new Date();
  hace30dias.setDate(hace30dias.getDate() - 30);
  const sesionesUltimoMes = historial.filter(s => new Date(s.fecha) >= hace30dias);
  const promedioMensual = (sesionesUltimoMes.length / 4.3).toFixed(2);
  document.getElementById("promedioEntrenamientos").textContent = `${promedioMensual} sesiones/semana`;

  // Mostrar fecha y nombre del último ejercicio en #ultimoEntreno
  const primerEjercicio = ultimaSesion?.ejercicios?.[0];
  const infoExtra = primerEjercicio?.series?.length
    ? `${primerEjercicio.nombre} - ${primerEjercicio.series[0].peso}kg`
    : primerEjercicio?.nombre || "Ejercicio no disponible";
  document.getElementById("ultimoEntreno").textContent = `${fechaUltima}\n${infoExtra}`;

  // Mostrar total de series esta semana en #seriesSemana
  document.getElementById("seriesSemana").textContent = seriesSemanaActual;
});
