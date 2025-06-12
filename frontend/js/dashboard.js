// Función para obtener ejercicios recomendados basados en el historial
function obtenerEjerciciosRecomendados(historial) {
  if (!historial || historial.length === 0) {
    return [];
  }

  // Contar la frecuencia de cada grupo muscular
  const frecuenciaGrupos = {};
  const fechaActual = new Date();
  const ultimos30Dias = new Date();
  ultimos30Dias.setDate(ultimos30Dias.getDate() - 30);

  historial.forEach(sesion => {
    const fechaSesion = new Date(sesion.fecha);
    if (fechaSesion < ultimos30Dias) return;

    sesion.ejercicios.forEach(ejercicio => {
      if (!ejercicio.grupoMuscular || ejercicio.grupoMuscular === "Otro") return;
      
      if (!frecuenciaGrupos[ejercicio.grupoMuscular]) {
        frecuenciaGrupos[ejercicio.grupoMuscular] = 0;
      }
      frecuenciaGrupos[ejercicio.grupoMuscular]++;
    });
  });

  // Ordenar grupos por frecuencia (de menor a mayor para priorizar los menos trabajados)
  const gruposOrdenados = Object.keys(frecuenciaGrupos).sort(
    (a, b) => (frecuenciaGrupos[a] || 0) - (frecuenciaGrupos[b] || 0)
  );

  // Tomar los 2-3 grupos menos trabajados
  const gruposARecomendar = gruposOrdenados.slice(0, 3);
  
  // Si no hay suficientes datos, usar grupos por defecto
  if (gruposARecomendar.length === 0) {
    return [
      { nombre: "Press banca con barra", grupo: "Pecho" },
      { nombre: "Sentadilla libre", grupo: "Piernas" },
      { nombre: "Remo con barra", grupo: "Espalda" },
      { nombre: "Press militar en máquina", grupo: "Hombros" },
      { nombre: "Curl con barra recta", grupo: "Bíceps" }
    ];
  }


  // Obtener ejercicios de los grupos recomendados
  const ejerciciosRecomendados = [];
  const ejerciciosPorGrupo = JSON.parse(localStorage.getItem('ejerciciosPorGrupo')) || {};
  
  gruposARecomendar.forEach(grupo => {
    if (ejerciciosPorGrupo[grupo]) {
      // Tomar hasta 2 ejercicios por grupo, evitando duplicados
      const ejerciciosDelGrupo = ejerciciosPorGrupo[grupo]
        .filter(ej => !ejerciciosRecomendados.some(e => e.nombre === ej))
        .slice(0, 2);
      
      ejerciciosDelGrupo.forEach(nombre => {
        ejerciciosRecomendados.push({
          nombre,
          grupo
        });
      });
    }
  });

  // Si no hay suficientes ejercicios, añadir algunos populares
  const ejerciciosPopulares = [
    { nombre: "Press banca con barra", grupo: "Pecho" },
    { nombre: "Sentadilla libre", grupo: "Piernas" },
    { nombre: "Peso muerto convencional", grupo: "Piernas" },
    { nombre: "Dominadas pronas", grupo: "Espalda" },
    { nombre: "Press militar en máquina", grupo: "Hombros" }
  ];

  while (ejerciciosRecomendados.length < 5) {
    const ejercicio = ejerciciosPopulares.find(
      e => !ejerciciosRecomendados.some(er => er.nombre === e.nombre)
    );
    if (ejercicio) {
      ejerciciosRecomendados.push(ejercicio);
    } else {
      break;
    }
  }

  return ejerciciosRecomendados.slice(0, 5); // Limitar a 5 ejercicios
}

// Función para mostrar los ejercicios recomendados
function mostrarEjerciciosRecomendados(ejercicios) {
  const contenedor = document.getElementById('ejerciciosRecomendados');
  if (!contenedor) return;

  if (ejercicios.length === 0) {
    contenedor.innerHTML = '<p>Comienza a registrar entrenamientos para obtener recomendaciones personalizadas.</p>';
    return;
  }

  contenedor.innerHTML = ''; // Limpiar contenedor
  
  ejercicios.forEach(ejercicio => {
    const elemento = document.createElement('p');
    elemento.textContent = ejercicio.nombre;
    elemento.title = `Grupo: ${ejercicio.grupo}`;
    elemento.addEventListener('click', () => {
      // Redirigir a la página de registro con el ejercicio seleccionado
      sessionStorage.setItem('ejercicioSeleccionado', JSON.stringify({
        grupo: ejercicio.grupo,
        nombre: ejercicio.nombre
      }));
      window.location.href = 'RegistroEntrenamientos.html';
    });
    contenedor.appendChild(elemento);
  });
}

// Importar funciones necesarias
import { inicializarRecomendaciones } from './recomendaciones.js';

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar recomendaciones
  if (document.getElementById('recomendacionesContainer')) {
    inicializarRecomendaciones();
  }
  
  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  const claveHistorial = "historial_" + usuario.nombre.toLowerCase();
  const historial = JSON.parse(localStorage.getItem(claveHistorial)) || [];

  const saludo = document.querySelector("h1");
  if (saludo) {
    saludo.innerHTML = `Hola, ${usuario.nombre}!<br>Domina tus límites con cada repetición.`;
  }

  // Cargar ejercicios recomendados
  const ejerciciosRecomendados = obtenerEjerciciosRecomendados(historial);
  mostrarEjerciciosRecomendados(ejerciciosRecomendados);

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
