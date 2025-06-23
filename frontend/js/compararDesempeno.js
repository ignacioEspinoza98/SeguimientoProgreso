// compararDesempeno.js

document.addEventListener("DOMContentLoaded", () => {
  const btnVolver = document.getElementById("volverDashboard");
  const selectSesionReciente = document.getElementById("sesionReciente");
  const selectSesionAnterior = document.getElementById("sesionAnterior");
  const btnComparar = document.getElementById("compararBtn");
  const resumenEstadisticas = document.getElementById("resumenEstadisticas");
  const listaEjercicios = document.getElementById("listaEjerciciosComparados");

  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  let historial = [];

  if (usuario && window.firebaseServices?.obtenerHistorial) {
    window.firebaseServices.obtenerHistorial(usuario.uid)
      .then((resultado) => {
        historial = resultado;
        historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        btnVolver.addEventListener('click', () => {
          window.location.href = 'Dashboard.html';
        });

        btnComparar.addEventListener('click', () => {
          const iReciente = parseInt(selectSesionReciente.value);
          const iAnterior = parseInt(selectSesionAnterior.value);
          if (!isNaN(iReciente) && !isNaN(iAnterior)) {
            compararSesiones(iReciente, iAnterior);
          } else {
            alert('Selecciona dos sesiones.');
          }
        });

        selectSesionReciente.addEventListener("change", () => {
          const iReciente = parseInt(selectSesionReciente.value);
          const iAnterior = parseInt(selectSesionAnterior.value);
          if (!isNaN(iReciente) && !isNaN(iAnterior)) {
            compararSesiones(iReciente, iAnterior);
          }
        });

        selectSesionAnterior.addEventListener("change", () => {
          const iReciente = parseInt(selectSesionReciente.value);
          const iAnterior = parseInt(selectSesionAnterior.value);
          if (!isNaN(iReciente) && !isNaN(iAnterior)) {
            compararSesiones(iReciente, iAnterior);
          }
        });

        cargarSesiones();
        if (historial.length >= 2) compararSesiones(0, 1);
      })
      .catch(console.error);
  }

  function cargarSesiones() {
    selectSesionReciente.innerHTML = '<option value="">Selecciona una sesión</option>';
    selectSesionAnterior.innerHTML = '<option value="">Selecciona una sesión</option>';
    historial.forEach((sesion, index) => {
      const fecha = new Date(sesion.fecha);
      const texto = `${fecha.toLocaleDateString()} - ${sesion.ejercicios.length} ejercicios`;
      const opt = new Option(texto, index);
      selectSesionReciente.add(opt.cloneNode(true));
      selectSesionAnterior.add(opt.cloneNode(true));
    });
    if (historial.length >= 2) {
      selectSesionReciente.value = 0;
      selectSesionAnterior.value = 1;
    }
  }

  function calcularDiferencia(actual, anterior) {
    if (anterior === 0) return 100;
    return Math.round(((actual - anterior) / anterior) * 100);
  }

  function formatearDiferencia(diff) {
    if (diff > 0) return `<span class="diferencia-positivo">+${diff}%</span>`;
    if (diff < 0) return `<span class="diferencia-negativo">${diff}%</span>`;
    return '<span class="diferencia-neutra">0%</span>';
  }

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
    let sumaPesos = 0, seriesConPeso = 0;
    console.log("Ejercicios en sesión:", sesion.ejercicios);
    sesion.ejercicios.forEach(ej => {
      ej.series.forEach(s => {
        const rep = +s.repeticiones || 0;
        const peso = +s.peso || 0;
        stats.totalSeries++;
        stats.totalRepeticiones += rep;
        stats.volumenTotal += rep * peso;
        if (peso > 0) {
          sumaPesos += peso;
          seriesConPeso++;
          if (peso > stats.pesoMaximo) stats.pesoMaximo = peso;
        }
      });
      if (ej.grupo  && ej.grupo .trim() !== '') {
        stats.gruposMusculares .add(ej.grupo .trim());
      }
    });
    stats.pesoPromedio = seriesConPeso ? sumaPesos / seriesConPeso : 0;
    stats.gruposMusculares = stats.gruposMusculares.size;
    return stats;
  }

  function mostrarResumenComparacion(r, a) {
    resumenEstadisticas.innerHTML = `
      <div class="estadistica-item"><h3>Total de Ejercicios</h3><p>${r.totalEjercicios}</p><p>${formatearDiferencia(calcularDiferencia(r.totalEjercicios, a.totalEjercicios))} vs ${a.totalEjercicios}</p></div>
      <div class="estadistica-item"><h3>Total de Series</h3><p>${r.totalSeries}</p><p>${formatearDiferencia(calcularDiferencia(r.totalSeries, a.totalSeries))} vs ${a.totalSeries}</p></div>
      <div class="estadistica-item"><h3>Total de Repeticiones</h3><p>${r.totalRepeticiones}</p><p>${formatearDiferencia(calcularDiferencia(r.totalRepeticiones, a.totalRepeticiones))} vs ${a.totalRepeticiones}</p></div>
      <div class="estadistica-item"><h3>Volumen Total (kg)</h3><p>${r.volumenTotal.toFixed(1)}</p><p>${formatearDiferencia(calcularDiferencia(r.volumenTotal, a.volumenTotal))} vs ${a.volumenTotal.toFixed(1)}</p></div>
      <div class="estadistica-item"><h3>Peso Promedio (kg)</h3><p>${r.pesoPromedio.toFixed(1)}</p><p>${formatearDiferencia(calcularDiferencia(r.pesoPromedio, a.pesoPromedio))} vs ${a.pesoPromedio.toFixed(1)}</p></div>
      <div class="estadistica-item"><h3>Peso Máximo (kg)</h3><p>${r.pesoMaximo.toFixed(1)}</p><p>${formatearDiferencia(calcularDiferencia(r.pesoMaximo, a.pesoMaximo))} vs ${a.pesoMaximo.toFixed(1)}</p></div>
      <div class="estadistica-item"><h3>Grupos Musculares</h3><p>${r.gruposMusculares}</p><p>${formatearDiferencia(calcularDiferencia(r.gruposMusculares, a.gruposMusculares))} vs ${a.gruposMusculares}</p></div>`;
  }

  function compararSesiones(iReciente, iAnterior) {
    const s1 = historial[iReciente];
    const s2 = historial[iAnterior];
    if (!s1 || !s2) return;
    const stats1 = calcularEstadisticasSesion(s1);
    const stats2 = calcularEstadisticasSesion(s2);
    mostrarResumenComparacion(stats1, stats2);
    compararEjercicios(s1, s2);
    document.getElementById("resultados").style.display = "block";
    document.getElementById("resultados").scrollIntoView({ behavior: "smooth" });
  }

  function compararEjercicios(s1, s2) {
    listaEjercicios.innerHTML = '';
    const nombres = new Set([...s1.ejercicios.map(e => e.nombre), ...s2.ejercicios.map(e => e.nombre)]);
    nombres.forEach(nombre => {
      const ej1 = s1.ejercicios.filter(e => e.nombre  === nombre);
      const ej2 = s2.ejercicios.filter(e => e.nombre  === nombre);

      console.log("Comparando:", nombre);
      console.log("Ej1:", ej1[0]);
      console.log("Ej2:", ej2[0]);

      const stats1 = calcularEstadisticasEjercicio(ej1);
      const stats2 = calcularEstadisticasEjercicio(ej2);
      if (stats1.totalSeries > 0 || stats2.totalSeries > 0) {
        const grupo = (ej1[0]?.grupo  || ej2[0]?.grupo  || '').trim() || "Sin grupo";
        listaEjercicios.appendChild(crearHTMLComparacionEjercicio(nombre, stats1, stats2, grupo));
      }
    });
  }

  function calcularEstadisticasEjercicio(ejs) {
    const stats = { totalSeries: 0, totalRepeticiones: 0, volumen: 0, pesoPromedio: 0, pesoMaximo: 0, repeticionesPromedio: 0 };
    let sumaPesos = 0, seriesConPeso = 0, sumaReps = 0;
    ejs.forEach(ej => {
      ej.series.forEach(s => {
        const rep = +s.repeticiones || 0;
        const peso = +s.peso || 0;
        stats.totalSeries++;
        stats.totalRepeticiones += rep;
        stats.volumen += rep * peso;
        if (peso > 0) {
          sumaPesos += peso;
          seriesConPeso++;
          if (peso > stats.pesoMaximo) stats.pesoMaximo = peso;
        }
        sumaReps += rep;
      });
    });
    stats.pesoPromedio = seriesConPeso ? sumaPesos / seriesConPeso : 0;
    stats.repeticionesPromedio = stats.totalSeries ? sumaReps / stats.totalSeries : 0;
    return stats;
  }

  function crearHTMLComparacionEjercicio(nombre, r, a, grupo) {
    const div = document.createElement('div');
    div.className = 'ejercicio-comparado';
    div.innerHTML = `
      <h3>${nombre} <span class="grupo-muscular">(${grupo})</span></h3>
      <div class="detalles-ejercicio">
        <div class="detalle-item"><h4>Volumen Total</h4><p>${r.volumen.toFixed(1)} kg</p><p>${formatearDiferencia(calcularDiferencia(r.volumen, a.volumen))} vs ${a.volumen.toFixed(1)}</p></div>
        <div class="detalle-item"><h4>Peso Promedio</h4><p>${r.pesoPromedio.toFixed(1)} kg</p><p>${formatearDiferencia(calcularDiferencia(r.pesoPromedio, a.pesoPromedio))} vs ${a.pesoPromedio.toFixed(1)}</p></div>
        <div class="detalle-item"><h4>Peso Máximo</h4><p>${r.pesoMaximo.toFixed(1)} kg</p><p>${formatearDiferencia(calcularDiferencia(r.pesoMaximo, a.pesoMaximo))} vs ${a.pesoMaximo.toFixed(1)}</p></div>
        <div class="detalle-item"><h4>Reps/Serie</h4><p>${r.repeticionesPromedio.toFixed(1)}</p><p>${formatearDiferencia(calcularDiferencia(r.repeticionesPromedio, a.repeticionesPromedio))} vs ${a.repeticionesPromedio.toFixed(1)}</p></div>
        <div class="detalle-item"><h4>Total Series</h4><p>${r.totalSeries}</p><p>${formatearDiferencia(calcularDiferencia(r.totalSeries, a.totalSeries))} vs ${a.totalSeries}</p></div>
      </div>`;
    return div;
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

  function calcularEstadisticasEjercicio(ejercicios) {
    const stats = {
      totalSeries: 0,
      totalRepeticiones: 0,
      volumen: 0,
      pesoPromedio: 0,
      pesoMaximo: 0,
      repeticionesPromedio: 0
    };

    if (!Array.isArray(ejercicios) || ejercicios.length === 0) return stats;

    let sumaPesos = 0;
    let totalSeriesConPeso = 0;
    let totalReps = 0;

    ejercicios.forEach(ejercicio => {
      if (!Array.isArray(ejercicio.series)) return;

      ejercicio.series.forEach(serie => {
        const peso = parseFloat(serie.peso) || 0;
        const reps = parseInt(serie.repeticiones) || 0;

        stats.totalSeries++;
        stats.totalRepeticiones += reps;
        stats.volumen += peso * reps;

        totalReps += reps;

        if (peso > 0) {
          sumaPesos += peso;
          totalSeriesConPeso++;
          if (peso > stats.pesoMaximo) {
            stats.pesoMaximo = peso;
          }
        }
      });
    });

    stats.pesoPromedio = totalSeriesConPeso > 0 ? sumaPesos / totalSeriesConPeso : 0;
    stats.repeticionesPromedio = stats.totalSeries > 0 ? totalReps / stats.totalSeries : 0;

    return stats;
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
    let sumaReps = 0;

    ejercicios.forEach(ejercicio => {
      if (!Array.isArray(ejercicio.series)) return;

      ejercicio.series.forEach(serie => {
        const peso = parseFloat(serie.peso) || 0;
        const reps = parseInt(serie.repeticiones) || 0;

        stats.totalSeries++;
        stats.totalRepeticiones += reps;
        stats.volumen += peso * reps;

        sumaReps += reps;

        if (peso > 0) {
          sumaPesos += peso;
          seriesConPeso++;
          if (peso > stats.pesoMaximo) {
            stats.pesoMaximo = peso;
          }
        }
      });
    });

    stats.pesoPromedio = seriesConPeso > 0 ? sumaPesos / seriesConPeso : 0;
    stats.repeticionesPromedio = stats.totalSeries > 0 ? sumaReps / stats.totalSeries : 0;

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

  // Inicializar
  cargarSesiones();

  // Si hay al menos dos sesiones, realizar comparación automática
  if (historial.length >= 2) {
    compararSesiones(0, 1);
  }
});
