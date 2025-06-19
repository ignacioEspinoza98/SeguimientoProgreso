if (!auth || !db) {
  console.error("Firebase no está correctamente inicializado");
}

document.addEventListener("DOMContentLoaded", () => {
  const { auth, db } = window.firebaseServices;
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      console.error("Usuario no autenticado");
      return;
    }

    const usuario = user;
    const historial = await obtenerHistorial(usuario.uid);
    console.log("Historial desde Firestore:", historial);

    actualizarResumenUltimaSesion(historial);
    mostrarEstadisticas(historial, usuario);

    const saludo = document.querySelector("h1");
    if (saludo) {
      saludo.textContent = `Hola, ${usuario.displayName || usuario.email || "Usuario"}!`;
      saludo.innerHTML += `<br>Domina tus límites con cada repetición.`;
    }

    document.getElementById("cerrarSesion")?.addEventListener("click", () => {
      sessionStorage.clear();
      auth.signOut().then(() => window.location.href = "index.html");
    });

    document.getElementById("exportarCSV")?.addEventListener("click", () => {
      exportarHistorialComoCSV(historial, usuario.uid);
    });
  });
});

function actualizarResumenUltimaSesion(historial) {
  if (!historial || historial.length === 0) {
    document.getElementById('fechaUltimaSesion').textContent = 'No hay sesiones registradas';
    document.getElementById('ejerciciosUltimaSesion').textContent = '--';
    document.getElementById('seriesUltimaSesion').textContent = '--';
    document.getElementById('volumenUltimaSesion').textContent = '--';
    return;
  }

  historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const ultimaSesion = historial[0];
  const ejercicios = ultimaSesion.ejercicios || [];

  const ejerciciosUnicos = new Set(ejercicios.map(e => e.nombre)).size;
  const seriesTotales = ejercicios.reduce((s, e) => s + (parseInt(e.series) || 0), 0);
  const volumenTotal = ejercicios.reduce((v, e) => {
    const p = parseFloat(e.peso) || 0;
    const r = parseInt(e.repeticiones) || 0;
    const s = parseInt(e.series) || 0;
    return v + (p * r * s);
  }, 0);

  const fecha = new Date(ultimaSesion.fecha);
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  document.getElementById('fechaUltimaSesion').textContent = fechaFormateada;
  document.getElementById('ejerciciosUltimaSesion').textContent = ejerciciosUnicos;
  document.getElementById('seriesUltimaSesion').textContent = seriesTotales;
  document.getElementById('volumenUltimaSesion').textContent = `${volumenTotal.toFixed(2)} kg`;
}

function mostrarEstadisticas(historial, usuario) {
  const ahora = new Date();
  const unaSemanaMs = 7 * 24 * 60 * 60 * 1000;

  let totalSeriesSemana = 0;
  let totalSeriesSemanaAnterior = 0;
  let pesoMaximo = 0;
  let ejercicioPesoMax = "N/A";
  let ultimaFecha = null;

  const seriesPorGrupo = {};
  const volumenPorGrupo = {};

  historial.forEach(sesion => {
    const fechaSesion = new Date(sesion.fecha);
    const diferencia = ahora - fechaSesion;

    if (!ultimaFecha || fechaSesion > new Date(ultimaFecha)) {
      ultimaFecha = sesion.fecha;
    }

    sesion.ejercicios.forEach(e => {
      const grupo = e.grupo || "Otro";
      const series = parseInt(e.series) || 0;
      const repes = parseInt(e.repeticiones) || 0;
      const peso = parseFloat(e.peso) || 0;

      if (diferencia <= unaSemanaMs) {
        seriesPorGrupo[grupo] = (seriesPorGrupo[grupo] || 0) + series;
        volumenPorGrupo[grupo] = (volumenPorGrupo[grupo] || 0) + (series * repes * peso);
        totalSeriesSemana += series;

        if (peso > pesoMaximo) {
          pesoMaximo = peso;
          ejercicioPesoMax = e.nombre;
        }
      } else if (diferencia <= unaSemanaMs * 2) {
        totalSeriesSemanaAnterior += series;
      }
    });
  });

  // Mostrar comparación de series
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

  document.getElementById("pesoMaximo").innerHTML = `<strong>${ejercicioPesoMax}</strong><br>${pesoMaximo} kg`;

  if (ultimaFecha) {
    const fechaFormateada = new Date(ultimaFecha).toLocaleDateString();
    const ultimaSesion = historial.find(s => s.fecha === ultimaFecha);
    const primerEjercicio = ultimaSesion?.ejercicios?.[0];
    const infoExtra = primerEjercicio ? `${primerEjercicio.nombre} - ${primerEjercicio.peso}kg` : "Ejercicio no disponible";
    document.getElementById("ultimoEntreno").innerHTML = `<strong>${fechaFormateada}</strong><br>${infoExtra}`;
  }

  document.getElementById("seriesSemana").innerHTML = `<strong>${totalSeriesSemana}</strong>`;

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
      li.textContent = `${grupo}: ${volumenPorGrupo[grupo].toLocaleString()} kg totales`;
      listaVolumen.appendChild(li);
    }
  }

  mostrarGrupoMasTrabajado(seriesPorGrupo);
  calcularPromedioEntrenamientosMensual(historial);
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

function calcularPromedioEntrenamientosMensual(historial) {
  const hoy = new Date();
  const hace30dias = new Date();
  hace30dias.setDate(hoy.getDate() - 30);

  const sesionesUltimoMes = historial.filter(sesion => {
    const fecha = new Date(sesion.fecha);
    return fecha >= hace30dias && fecha <= hoy;
  });

  const promedio = (sesionesUltimoMes.length / 4.3).toFixed(2);
  document.getElementById("promedioEntrenamientos").textContent = `${promedio} sesiones/semana`;
}

function exportarHistorialComoCSV(historial, nombreUsuario) {
  const filas = [["Fecha", "Ejercicio", "Grupo Muscular", "Peso", "Reps", "Series"]];
  historial.forEach(sesion => {
    sesion.ejercicios.forEach(e => {
      filas.push([
        new Date(sesion.fecha).toLocaleDateString(),
        e.nombre,
        e.grupo,
        e.peso,
        e.repeticiones,
        e.series
      ]);
    });
  });

  const csv = filas.map(fila => fila.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `historial_${nombreUsuario}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
