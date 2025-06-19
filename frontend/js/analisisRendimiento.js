auth = window.firebaseServices?.auth;
obtenerHistorial = window.firebaseServices?.obtenerHistorial;

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      console.error("Usuario no autenticado");
      return;
    }

    const historial = await obtenerHistorial(user.uid);
    if (!historial || historial.length === 0) return;

    const selectEjercicio = document.getElementById("filtro-ejercicio");
    const selectVista = document.getElementById("vista-grafico");
    const selectTiempo = document.getElementById("filtro-tiempo");
    const ctx = document.getElementById("graficoRendimiento").getContext("2d");

    let chart;
    const ejerciciosUnicos = new Set();
    const recordsPorEjercicio = {};
    const historialPorEjercicio = {};

    historial.forEach(sesion => {
      sesion.ejercicios.forEach(e => {
        ejerciciosUnicos.add(e.nombre);
        if (!historialPorEjercicio[e.nombre]) historialPorEjercicio[e.nombre] = [];
        historialPorEjercicio[e.nombre].push({ fecha: sesion.fecha, series: e.series });

        e.series.forEach(s => {
          const peso = parseFloat(s.peso) || 0;
          if (peso > (recordsPorEjercicio[e.nombre] || 0)) {
            recordsPorEjercicio[e.nombre] = peso;
          }
        });
      });
    });

    const lista = document.getElementById("lista-records");
    for (const ejercicio in recordsPorEjercicio) {
      const li = document.createElement("li");
      li.textContent = `${ejercicio}: ${recordsPorEjercicio[ejercicio]} kg`;
      lista.appendChild(li);
    }

    ejerciciosUnicos.forEach(nombre => {
      const opt = document.createElement("option");
      opt.value = nombre;
      opt.textContent = nombre;
      selectEjercicio.appendChild(opt);
    });

    function renderizarGrafico() {
      const ejercicioSeleccionado = selectEjercicio.value;
      const vista = selectVista.value;
      const filtroDias = selectTiempo.value;

      if (!ejercicioSeleccionado || !historialPorEjercicio[ejercicioSeleccionado]) {
        if (chart) chart.destroy();
        document.getElementById("contadorSesiones").textContent = "Selecciona un ejercicio para ver el gráfico.";
        document.getElementById("evolucionPorcentual").innerHTML = "";
        document.getElementById("pesoMaxAnalisis").textContent = "-- kg";
        document.getElementById("entrenamientosTotal").textContent = "--";
        document.getElementById("promedioReps").textContent = "--";
        return;
      }

      const ahora = new Date();
      const limiteDias = filtroDias === "historial" ? null : parseInt(filtroDias);
      const datosFiltrados = [];

      historialPorEjercicio[ejercicioSeleccionado].forEach(ej => {
        const fechaSesion = new Date(ej.fecha);
        const diferenciaDias = (ahora - fechaSesion) / (1000 * 60 * 60 * 24);
        if (limiteDias === null || diferenciaDias <= limiteDias) {
          const totalSeries = ej.series.length;
          const pesoPromedio = ej.series.reduce((acc, s) => acc + (parseFloat(s.peso) || 0), 0) / totalSeries;
          const repsPromedio = ej.series.reduce((acc, s) => acc + (parseInt(s.repeticiones) || 0), 0) / totalSeries;
          const volumen = ej.series.reduce((acc, s) => acc + ((parseFloat(s.peso) || 0) * (parseInt(s.repeticiones) || 0)), 0);

          datosFiltrados.push({
            fecha: fechaSesion,
            label: fechaSesion.toLocaleDateString(),
            peso: pesoPromedio,
            series: totalSeries,
            repeticiones: repsPromedio,
            volumen
          });
        }
      });

      datosFiltrados.sort((a, b) => a.fecha - b.fecha);

      const labels = datosFiltrados.map(d => d.label);
      const valoresY = datosFiltrados.map(d => vista === "series" ? d.series : d.peso);
      const maxValor = Math.max(...valoresY);
      const indexMax = valoresY.indexOf(maxValor);

      if (chart) chart.destroy();

      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: `Progreso - ${ejercicioSeleccionado} (${vista === "series" ? 'Series' : 'Kg'})`,
            data: valoresY,
            borderColor: '#ffa500',
            backgroundColor: 'rgba(255, 165, 0, 0.2)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: valoresY.map((_, i) => i === indexMax ? '#00ff00' : '#ffa500'),
            pointBorderColor: valoresY.map((_, i) => i === indexMax ? '#00ff00' : '#ffa500'),
            pointRadius: valoresY.map((_, i) => i === indexMax ? 7 : 4),
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, ticks: { color: '#fff' } },
            x: { ticks: { color: '#fff' } }
          },
          plugins: {
            legend: {
              onClick: null,
              labels: { color: '#fff' }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return context.dataIndex === indexMax
                    ? `📍 Récord: ${context.parsed.y} ${vista === "series" ? "series" : "kg"}`
                    : `${context.parsed.y} ${vista === "series" ? "series" : "kg"}`;
                }
              }
            }
          }
        }
      });

      const contador = datosFiltrados.length;
      document.getElementById("contadorSesiones").textContent =
        `Has entrenado ${ejercicioSeleccionado} en ${contador} sesión${contador !== 1 ? 'es' : ''}`;

      const primer = datosFiltrados[0];
      const ultimo = datosFiltrados[datosFiltrados.length - 1];

      const primerValor = primer ? primer.volumen : null;
      const ultimoValor = ultimo ? ultimo.volumen : null;

      const evolucionElement = document.getElementById("evolucionPorcentual");
      if (datosFiltrados.length >= 2 && primerValor > 0 && ultimoValor !== null) {
        const diferencia = ultimoValor - primerValor;
        const porcentaje = ((diferencia / primerValor) * 100).toFixed(1);
        const signo = porcentaje >= 0 ? "+" : "";
        evolucionElement.innerHTML =
          `${signo}${porcentaje}% en ${ejercicioSeleccionado}<br><small style="font-size: 0.8em; color: #aaa;">Basado en volumen total (peso × reps)</small>`;
      } else {
        evolucionElement.innerHTML =
          "Sin datos suficientes<br><small style='font-size: 0.8em; color: #aaa;'>Basado en volumen total (peso × reps)</small>";
      }

      const pesos = datosFiltrados.map(d => d.peso);
      const reps = datosFiltrados.map(d => d.repeticiones);

      document.getElementById("pesoMaxAnalisis").textContent = `${Math.max(...pesos).toFixed(1)} kg`;
      document.getElementById("entrenamientosTotal").textContent = contador;
      document.getElementById("promedioReps").textContent = (reps.reduce((a, b) => a + b, 0) / reps.length).toFixed(1);
    }

    selectEjercicio.addEventListener("change", renderizarGrafico);
    selectVista.addEventListener("change", renderizarGrafico);
    selectTiempo.addEventListener("change", renderizarGrafico);

    if (selectEjercicio.options.length > 0) {
      selectEjercicio.selectedIndex = 0;
      selectEjercicio.dispatchEvent(new Event("change"));
    }
  });
});
