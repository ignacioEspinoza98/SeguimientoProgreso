document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const btnVolver = document.getElementById("volverDashboard");
  const selectSesionReciente = document.getElementById("sesionReciente");
  const selectSesionAnterior = document.getElementById("sesionAnterior");
  const btnComparar = document.getElementById("compararBtn");
  const resumenEstadisticas = document.getElementById("resumenEstadisticas");
  const listaEjercicios = document.getElementById("listaEjerciciosComparados");

  // Obtener datos del usuario
  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  const claveHistorial = `historial_${usuario.nombre.toLowerCase()}`;
  let historial = JSON.parse(localStorage.getItem(claveHistorial)) || [];

  // Ordenar el historial por fecha (más reciente primero)
  historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // Cargar selectores de sesiones
  function cargarSesiones() {
    // Limpiar selectores
    selectSesionReciente.innerHTML = '<option value="">Selecciona una sesión</option>';
    selectSesionAnterior.innerHTML = '<option value="">Selecciona una sesión</option>';

    if (historial.length === 0) {
      // Deshabilitar botón si no hay sesiones
      btnComparar.disabled = true;
      return;
    }


    // Llenar selectores con las sesiones
    historial.forEach((sesion, index) => {
      const fecha = new Date(sesion.fecha);
      const opcionTexto = `${fecha.toLocaleDateString()} - ${sesion.ejercicios.length} ejercicios`;
      
      const opcionReciente = document.createElement("option");
      opcionReciente.value = index;
      opcionReciente.textContent = opcionTexto;
      
      const opcionAnterior = opcionReciente.cloneNode(true);
      
      selectSesionReciente.appendChild(opcionReciente);
      selectSesionAnterior.appendChild(opcionAnterior);
    });

    // Seleccionar automáticamente las dos sesiones más recientes si hay al menos 2
    if (historial.length >= 2) {
      selectSesionReciente.value = 0;
      selectSesionAnterior.value = 1;
    } else if (historial.length === 1) {
      selectSesionReciente.value = 0;
      btnComparar.disabled = true;
    }
  }

  // Función para formatear fechas
  function formatearFecha(fechaStr) {
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fechaStr).toLocaleDateString('es-ES', opciones);
  }

  // Función para calcular la diferencia porcentual
  function calcularDiferencia(actual, anterior) {
    if (anterior === 0) return 100; // Evitar división por cero
    return Math.round(((actual - anterior) / anterior) * 100);
  }

  // Función para formatear la diferencia con icono
  function formatearDiferencia(diferencia) {
    if (diferencia > 0) {
      return `<span class="diferencia-positivo">+${diferencia}%</span>`;
    } else if (diferencia < 0) {
      return `<span class="diferencia-negativo">${diferencia}%</span>`;
    } else {
      return '<span class="diferencia-neutra">0%</span>';
    }
  }

  // Función para comparar dos sesiones
  function compararSesiones(indiceReciente, indiceAnterior) {
    if (indiceReciente === null || indiceAnterior === null) return;

    const sesionReciente = historial[indiceReciente];
    const sesionAnterior = historial[indiceAnterior];

    if (!sesionReciente || !sesionAnterior) return;

    // Calcular estadísticas de la sesión reciente
    const statsReciente = calcularEstadisticasSesion(sesionReciente);
    const statsAnterior = calcularEstadisticasSesion(sesionAnterior);

    // Mostrar resumen de comparación
    mostrarResumenComparacion(statsReciente, statsAnterior, sesionReciente.fecha, sesionAnterior.fecha);

    // Comparar ejercicios
    compararEjercicios(sesionReciente, sesionAnterior);

    // Hacer scroll a los resultados
    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth' });
  }

  // Función para calcular estadísticas de una sesión
  function calcularEstadisticasSesion(sesion) {
    const stats = {
      totalEjercicios: sesion.ejercicios.length,
      totalSeries: 0,
      totalRepeticiones: 0,
      volumenTotal: 0,
      pesoPromedio: 0,
      pesoMaximo: 0,
      gruposMusculares: new Set()
    };

    let sumaPesos = 0;
    let ejerciciosConPeso = 0;

    sesion.ejercicios.forEach(ejercicio => {
      const series = parseInt(ejercicio.series) || 0;
      const repeticiones = parseInt(ejercicio.repeticiones) || 0;
      const peso = parseFloat(ejercicio.peso) || 0;

      stats.totalSeries += series;
      stats.totalRepeticiones += series * repeticiones;
      stats.volumenTotal += series * repeticiones * peso;
      
      if (peso > 0) {
        sumaPesos += peso;
        ejerciciosConPeso++;
        if (peso > stats.pesoMaximo) {
          stats.pesoMaximo = peso;
        }
      }

      if (ejercicio.grupoMuscular) {
        stats.gruposMusculares.add(ejercicio.grupoMuscular);
      }
    });

    stats.pesoPromedio = ejerciciosConPeso > 0 ? sumaPesos / ejerciciosConPeso : 0;
    stats.gruposMusculares = stats.gruposMusculares.size;

    return stats;
  }

  // Función para mostrar el resumen de la comparación
  function mostrarResumenComparacion(reciente, anterior, fechaReciente, fechaAnterior) {
    // Calcular diferencias
    const diffEjercicios = calcularDiferencia(reciente.totalEjercicios, anterior.totalEjercicios);
    const diffSeries = calcularDiferencia(reciente.totalSeries, anterior.totalSeries);
    const diffReps = calcularDiferencia(reciente.totalRepeticiones, anterior.totalRepeticiones);
    const diffVolumen = calcularDiferencia(reciente.volumenTotal, anterior.volumenTotal);
    const diffPesoPromedio = calcularDiferencia(reciente.pesoPromedio, anterior.pesoPromedio);
    const diffPesoMaximo = calcularDiferencia(reciente.pesoMaximo, anterior.pesoMaximo);
    const diffGrupos = calcularDiferencia(reciente.gruposMusculares, anterior.gruposMusculares);

    // Crear HTML del resumen
    resumenEstadisticas.innerHTML = `
      <div class="estadistica-item">
        <h3>Total de Ejercicios</h3>
        <p class="estadistica-valor">${reciente.totalEjercicios}</p>
        <p class="estadistica-diferencia">
          ${formatearDiferencia(diffEjercicios)} vs ${anterior.totalEjercicios}
        </p>
      </div>
      <div class="estadistica-item">
        <h3>Total de Series</h3>
        <p class="estadistica-valor">${reciente.totalSeries}</p>
        <p class="estadistica-diferencia">
          ${formatearDiferencia(diffSeries)} vs ${anterior.totalSeries}
        </p>
      </div>
      <div class="estadistica-item">
        <h3>Total de Repeticiones</h3>
        <p class="estadistica-valor">${reciente.totalRepeticiones}</p>
        <p class="estadistica-diferencia">
          ${formatearDiferencia(diffReps)} vs ${anterior.totalRepeticiones}
        </p>
      </div>
      <div class="estadistica-item">
        <h3>Volumen Total (kg)</h3>
        <p class="estadistica-valor">${reciente.volumenTotal.toFixed(1)}</p>
        <p class="estadistica-diferencia">
          ${formatearDiferencia(diffVolumen)} vs ${anterior.volumenTotal.toFixed(1)}
        </p>
      </div>
      <div class="estadistica-item">
        <h3>Peso Promedio (kg)</h3>
        <p class="estadistica-valor">${reciente.pesoPromedio.toFixed(1)}</p>
        <p class="estadistica-diferencia">
          ${formatearDiferencia(diffPesoPromedio)} vs ${anterior.pesoPromedio.toFixed(1)}
        </p>
      </div>
      <div class="estadistica-item">
        <h3>Peso Máximo (kg)</h3>
        <p class="estadistica-valor">${reciente.pesoMaximo.toFixed(1)}</p>
        <p class="estadistica-diferencia">
          ${formatearDiferencia(diffPesoMaximo)} vs ${anterior.pesoMaximo.toFixed(1)}
        </p>
      </div>
      <div class="estadistica-item">
        <h3>Grupos Musculares</h3>
        <p class="estadistica-valor">${reciente.gruposMusculares}</p>
        <p class="estadistica-diferencia">
          ${formatearDiferencia(diffGrupos)} vs ${anterior.gruposMusculares}
        </p>
      </div>
    `;
  }

  // Función para comparar ejercicios individuales
  function compararEjercicios(sesionReciente, sesionAnterior) {
    listaEjercicios.innerHTML = '';

    // Agrupar ejercicios por nombre
    const ejerciciosRecientes = {};
    const ejerciciosAnteriores = {};

    sesionReciente.ejercicios.forEach(ej => {
      if (!ejerciciosRecientes[ej.ejercicio]) {
        ejerciciosRecientes[ej.ejercicio] = [];
      }
      ejerciciosRecientes[ej.ejercicio].push(ej);
    });

    sesionAnterior.ejercicios.forEach(ej => {
      if (!ejerciciosAnteriores[ej.ejercicio]) {
        ejerciciosAnteriores[ej.ejercicio] = [];
      }
      ejerciciosAnteriores[ej.ejercicio].push(ej);
    });

    // Encontrar ejercicios en común y mostrarlos
    const ejerciciosComunes = new Set([
      ...Object.keys(ejerciciosRecientes),
      ...Object.keys(ejerciciosAnteriores)
    ]);

    if (ejerciciosComunes.size === 0) {
      listaEjercicios.innerHTML = '<p>No hay ejercicios en común para comparar.</p>';
      return;
    }

    ejerciciosComunes.forEach(nombreEjercicio => {
      const ejRecientes = ejerciciosRecientes[nombreEjercicio] || [];
      const ejAnteriores = ejerciciosAnteriores[nombreEjercicio] || [];

      // Calcular promedios para el ejercicio reciente
      const statsReciente = calcularEstadisticasEjercicio(ejRecientes);
      const statsAnterior = calcularEstadisticasEjercicio(ejAnteriores);

      // Solo mostrar si hay datos en al menos una de las sesiones
      if (statsReciente.totalSeries > 0 || statsAnterior.totalSeries > 0) {
        const ejercicioHTML = crearHTMLComparacionEjercicio(
          nombreEjercicio, 
          statsReciente, 
          statsAnterior,
          ejRecientes[0]?.grupoMuscular || 'Sin grupo'
        );
        listaEjercicios.appendChild(ejercicioHTML);
      }
    });
  }

  // Función para calcular estadísticas de un ejercicio específico
  function calcularEstadisticasEjercicio(ejercicios) {
    const stats = {
      totalSeries: 0,
      totalRepeticiones: 0,
      volumen: 0,
      pesoPromedio: 0,
      pesoMaximo: 0,
      repeticionesPromedio: 0
    };

    if (ejercicios.length === 0) return stats;

    let sumaPesos = 0;
    let seriesConPeso = 0;
    let sumaRepsPorSerie = 0;

    ejercicios.forEach(ejercicio => {
      const series = parseInt(ejercicio.series) || 0;
      const repeticiones = parseInt(ejercicio.repeticiones) || 0;
      const peso = parseFloat(ejercicio.peso) || 0;

      stats.totalSeries += series;
      stats.totalRepeticiones += series * repeticiones;
      stats.volumen += series * repeticiones * peso;
      
      if (peso > 0) {
        sumaPesos += peso * series; // Ponderar por series
        seriesConPeso += series;
        if (peso > stats.pesoMaximo) {
          stats.pesoMaximo = peso;
        }
      }
      
      sumaRepsPorSerie += repeticiones * series;
    });

    stats.pesoPromedio = seriesConPeso > 0 ? sumaPesos / seriesConPeso : 0;
    stats.repeticionesPromedio = stats.totalSeries > 0 ? sumaRepsPorSerie / stats.totalSeries : 0;

    return stats;
  }

  // Función para crear el HTML de comparación de un ejercicio
  function crearHTMLComparacionEjercicio(nombre, reciente, anterior, grupo) {
    const contenedor = document.createElement('div');
    contenedor.className = 'ejercicio-comparado';

    // Calcular diferencias
    const diffVolumen = calcularDiferencia(reciente.volumen, anterior.volumen);
    const diffPesoPromedio = calcularDiferencia(reciente.pesoPromedio, anterior.pesoPromedio);
    const diffPesoMaximo = calcularDiferencia(reciente.pesoMaximo, anterior.pesoMaximo);
    const diffRepsPromedio = calcularDiferencia(reciente.repeticionesPromedio, anterior.repeticionesPromedio);

    contenedor.innerHTML = `
      <h3>${nombre} <span class="grupo-muscular">(${grupo})</span></h3>
      <div class="detalles-ejercicio">
        <div class="detalle-item">
          <h4>Volumen Total</h4>
          <p class="detalle-valor">${reciente.volumen.toFixed(1)} kg</p>
          <p class="estadistica-diferencia">${formatearDiferencia(diffVolumen)} vs ${anterior.volumen.toFixed(1)}</p>
        </div>
        <div class="detalle-item">
          <h4>Peso Promedio</h4>
          <p class="detalle-valor">${reciente.pesoPromedio.toFixed(1)} kg</p>
          <p class="estadistica-diferencia">${formatearDiferencia(diffPesoPromedio)} vs ${anterior.pesoPromedio.toFixed(1)}</p>
        </div>
        <div class="detalle-item">
          <h4>Peso Máximo</h4>
          <p class="detalle-valor">${reciente.pesoMaximo.toFixed(1)} kg</p>
          <p class="estadistica-diferencia">${formatearDiferencia(diffPesoMaximo)} vs ${anterior.pesoMaximo.toFixed(1)}</p>
        </div>
        <div class="detalle-item">
          <h4>Reps/Serie</h4>
          <p class="detalle-valor">${reciente.repeticionesPromedio.toFixed(1)}</p>
          <p class="estadistica-diferencia">${formatearDiferencia(diffRepsPromedio)} vs ${anterior.repeticionesPromedio.toFixed(1)}</p>
        </div>
        <div class="detalle-item">
          <h4>Total Series</h4>
          <p class="detalle-valor">${reciente.totalSeries}</p>
          <p class="estadistica-diferencia">${formatearDiferencia(calcularDiferencia(reciente.totalSeries, anterior.totalSeries))} vs ${anterior.totalSeries}</p>
        </div>
      </div>
    `;

    return contenedor;
  }

  // Event Listeners
  btnVolver.addEventListener('click', () => {
    window.location.href = '../html/Dashboard.html';
  });

  btnComparar.addEventListener('click', () => {
    const indiceReciente = selectSesionReciente.value !== '' ? parseInt(selectSesionReciente.value) : null;
    const indiceAnterior = selectSesionAnterior.value !== '' ? parseInt(selectSesionAnterior.value) : null;
    
    if (indiceReciente !== null && indiceAnterior !== null) {
      compararSesiones(indiceReciente, indiceAnterior);
    } else {
      alert('Por favor, selecciona dos sesiones para comparar.');
    }
  });

  // Inicializar
  cargarSesiones();

  // Si hay al menos dos sesiones, realizar comparación automática
  if (historial.length >= 2) {
    compararSesiones(0, 1);
  }
});
