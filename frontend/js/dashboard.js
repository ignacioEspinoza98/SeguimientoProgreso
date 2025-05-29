document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  const claveHistorial = "historial_" + usuario.nombre.toLowerCase();
  const historial = JSON.parse(localStorage.getItem(claveHistorial)) || [];

  const saludo = document.querySelector("h1");
  if (saludo) {
    saludo.innerHTML = `Hola, ${usuario.nombre}!<br>Domina tus límites con cada repetición.`;
  }

  if (historial.length === 0) return;

  const ahora = new Date();
  const unaSemanaMs = 7 * 24 * 60 * 60 * 1000;

  let totalSeriesSemana = 0;
  let totalSeriesSemanaAnterior = 0;
  let pesoMaximo = 0;
  let ejercicioPesoMax = "N/A";
  let ultimaFecha = null;

  const seriesPorGrupo = {};
  const volumenPorGrupo = {};

  // Calcular series de la semana anterior
  historial.forEach(sesion => {
    const fechaSesion = new Date(sesion.fecha);
    const diferencia = ahora - fechaSesion;

    if (diferencia > unaSemanaMs && diferencia <= unaSemanaMs * 2) {
      sesion.ejercicios.forEach(e => {
        if (!e.grupoMuscular || e.grupoMuscular === "Otro") return;
        totalSeriesSemanaAnterior += parseInt(e.series) || 0;
      });
    }
  });

  // Calcular datos actuales (semana actual, último entreno, etc.)
  historial.forEach(sesion => {
    const fechaSesion = new Date(sesion.fecha);

    if (!ultimaFecha || fechaSesion > new Date(ultimaFecha)) {
      ultimaFecha = sesion.fecha;
    }

    if (ahora - fechaSesion <= unaSemanaMs) {
      sesion.ejercicios.forEach(e => {
        if (!e.grupoMuscular || e.grupoMuscular === "Otro") return;

        const grupo = e.grupoMuscular;
        const series = parseInt(e.series) || 0;
        const repes = parseInt(e.repeticiones) || 0;
        const peso = parseFloat(e.peso) || 0;

        seriesPorGrupo[grupo] = (seriesPorGrupo[grupo] || 0) + series;
        volumenPorGrupo[grupo] = (volumenPorGrupo[grupo] || 0) + (series * repes * peso);
        totalSeriesSemana += series;

        if (peso > pesoMaximo) {
          pesoMaximo = peso;
          ejercicioPesoMax = e.ejercicio;
        }
      });
    }
  });

  // Comparación de series con la semana pasada
  const comparacionTexto = document.getElementById("comparacionSemanal");
  const diferencia = totalSeriesSemana - totalSeriesSemanaAnterior;

  if (comparacionTexto) {
    if (diferencia > 0) {
      comparacionTexto.textContent = `📈 +${diferencia} series respecto a la semana pasada`;
    } else if (diferencia < 0) {
      comparacionTexto.textContent = `📉 ${diferencia} series respecto a la semana pasada`;
    } else {
      comparacionTexto.textContent = `⚖️ Mismo número de series que la semana pasada`;
    }
  }

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

    document.getElementById("ultimoEntreno").innerHTML =
      `<strong>${fechaFormateada}</strong><br>${infoExtra}`;
  }

  // Mostrar total de series esta semana
  document.getElementById("seriesSemana").innerHTML = `<strong>${totalSeriesSemana}</strong>`;

  // Mostrar resumen por grupo muscular (series)
  const listaGrupos = document.getElementById("seriesPorGrupo");
  listaGrupos.innerHTML = "";
  for (const grupo in seriesPorGrupo) {
    const li = document.createElement("li");
    li.textContent = `${grupo}: ${seriesPorGrupo[grupo]} series`;
    listaGrupos.appendChild(li);
  }

  // Mostrar volumen por grupo muscular
  const listaVolumen = document.getElementById("volumenPorGrupo");
  if (listaVolumen) {
    listaVolumen.innerHTML = "";
    for (const grupo in volumenPorGrupo) {
      const li = document.createElement("li");
      li.textContent = `${grupo}: ${volumenPorGrupo[grupo].toLocaleString()} kg totales`;
      listaVolumen.appendChild(li);
    }
  }

  // Mostrar promedio de entrenamientos por semana (últimos 30 días)
  calcularPromedioEntrenamientosMensual(historial);

  // Mostrar grupo más trabajado de la semana
  mostrarGrupoMasTrabajado(seriesPorGrupo);

  // Botones de exportación
// document.getElementById("exportarJSON").addEventListener("click", () => {
//   exportarHistorialComoJSON(historial, usuario.nombre.toLowerCase());
// });

  document.getElementById("exportarCSV").addEventListener("click", () => {
    exportarHistorialComoCSV(historial, usuario.nombre.toLowerCase());
  });

  // Cerrar sesión
  document.getElementById("cerrarSesion").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
  });
});

function calcularPromedioEntrenamientosMensual(historial) {
  const hoy = new Date();
  const hace30dias = new Date();
  hace30dias.setDate(hoy.getDate() - 30);

  const sesionesUltimoMes = historial.filter(sesion => {
    const fecha = new Date(sesion.fecha);
    return fecha >= hace30dias && fecha <= hoy;
  });

  const promedio = (sesionesUltimoMes.length / 4.3).toFixed(2);

  document.getElementById("promedioEntrenamientos").textContent =
    `${promedio} sesiones/semana`;
}

function mostrarGrupoMasTrabajado(seriesPorGrupo) {
  let grupoMas = null;
  let maxSeries = 0;

  for (const grupo in seriesPorGrupo) {
    if (seriesPorGrupo[grupo] > maxSeries) {
      maxSeries = seriesPorGrupo[grupo];
      grupoMas = grupo;
    }
  }

  const grupoTexto = grupoMas
    ? `${grupoMas} (${maxSeries} series)`
    : "No hay datos esta semana";

  document.getElementById("grupoMasTrabajado").textContent = grupoTexto;
}

// Exportar JSON
function exportarHistorialComoJSON(historial, nombreUsuario) {
  const blob = new Blob([JSON.stringify(historial, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  descargarArchivo(url, `historial_${nombreUsuario}.json`);
}

// Exportar CSV
function exportarHistorialComoCSV(historial, nombreUsuario) {
  const filas = [["Fecha", "Ejercicio", "Grupo Muscular", "Peso", "Reps", "Series"]];
  historial.forEach(sesion => {
    sesion.ejercicios.forEach(e => {
      filas.push([
        new Date(sesion.fecha).toLocaleDateString(),
        e.ejercicio,
        e.grupoMuscular,
        e.peso,
        e.repeticiones,
        e.series
      ]);
    });
  });

  const csv = filas.map(fila => fila.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  descargarArchivo(url, `historial_${nombreUsuario}.csv`);
}

// Utilidad común para descargar
function descargarArchivo(url, nombreArchivo) {
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
