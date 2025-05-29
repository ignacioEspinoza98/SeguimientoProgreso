document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  const claveHistorial = "historial_" + usuario.nombre.toLowerCase();
  const historial = JSON.parse(localStorage.getItem(claveHistorial)) || [];

  if (historial.length === 0) return;

  const selectEjercicio = document.getElementById("filtro-ejercicio");
  const selectVista = document.getElementById("vista-grafico");
  const selectTiempo = document.getElementById("filtro-tiempo");
  const ctx = document.getElementById("graficoRendimiento").getContext("2d");

  let chart;

  const ejerciciosUnicos = new Set();
  const recordsPorEjercicio = {};
  let pesoMaximo = 0, entrenamientoTotal = 0, totalReps = 0, totalSeries = 0;

  historial.forEach(sesion => {
    entrenamientoTotal++;
    sesion.ejercicios.forEach(e => {
      ejerciciosUnicos.add(e.ejercicio);

      if (e.peso > pesoMaximo) pesoMaximo = e.peso;
      totalReps += (parseInt(e.repeticiones) || 0) * (parseInt(e.series) || 0);
      totalSeries += parseInt(e.series) || 0;

      if (!recordsPorEjercicio[e.ejercicio] || e.peso > recordsPorEjercicio[e.ejercicio]) {
        recordsPorEjercicio[e.ejercicio] = e.peso;
      }
    });
  });

  document.getElementById("pesoMaxAnalisis").textContent = `${pesoMaximo} kg`;
  document.getElementById("entrenamientosTotal").textContent = entrenamientoTotal;
  document.getElementById("promedioReps").textContent = totalSeries > 0
    ? (totalReps / totalSeries).toFixed(1)
    : "0";

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

    if (!ejercicioSeleccionado) return;

    const datosFiltrados = [];
    const ahora = new Date();
    const limiteDias = filtroDias === "historial" ? null : parseInt(filtroDias);

    historial.forEach(sesion => {
      const fechaSesion = new Date(sesion.fecha);
      const diferenciaDias = (ahora - fechaSesion) / (1000 * 60 * 60 * 24);

      if (limiteDias === null || diferenciaDias <= limiteDias) {
        sesion.ejercicios.forEach(e => {
          if (e.ejercicio === ejercicioSeleccionado) {
            datosFiltrados.push({
              fecha: fechaSesion.toLocaleDateString(),
              peso: e.peso,
              series: e.series,
              repeticiones: e.repeticiones
            });
          }
        });
      }
    });

    const labels = datosFiltrados.map(d => d.fecha);
    const valoresY = datosFiltrados.map(d => vista === "series" ? d.series : d.peso);

    // 🟩 Identificar récord personal en la vista actual
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
          y: {
            beginAtZero: true,
            ticks: { color: '#fff' }
          },
          x: {
            ticks: { color: '#fff' }
          }
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

    // Contador de sesiones
    const contador = datosFiltrados.length;
    if (!document.getElementById("contadorSesiones")) {
      const p = document.createElement("p");
      p.id = "contadorSesiones";
      p.style.marginTop = "1rem";
      p.style.color = "#ffa500";
      ctx.canvas.parentNode.appendChild(p);
    }
    document.getElementById("contadorSesiones").textContent =
      `Has entrenado ${ejercicioSeleccionado} en ${contador} sesión${contador !== 1 ? 'es' : ''}`;

    // 📈 Evolución porcentual (basado en potencia estimada)
    const evolucionElement = document.getElementById("evolucionPorcentual");
    const primer = datosFiltrados[0];
    const ultimo = datosFiltrados[datosFiltrados.length - 1];

    const primerValor = primer ? primer.peso * (primer.repeticiones || 1) : null;
    const ultimoValor = ultimo ? ultimo.peso * (ultimo.repeticiones || 1) : null;

    if (datosFiltrados.length >= 2 && primerValor > 0 && ultimoValor !== null) {
      const diferencia = ultimoValor - primerValor;
      const porcentaje = ((diferencia / primerValor) * 100).toFixed(1);
      const signo = porcentaje >= 0 ? "+" : "";
      const emoji = porcentaje >= 0 ? "📈" : "📉";
      evolucionElement.innerHTML =
        `${emoji} ${signo}${porcentaje}% en ${ejercicioSeleccionado}<br><small style="font-size: 0.8em; color: #aaa;">Basado en potencia estimada (kg × reps)</small>`;
    } else {
      evolucionElement.innerHTML =
        "Sin datos suficientes<br><small style='font-size: 0.8em; color: #aaa;'>Basado en potencia estimada (kg × reps)</small>";
    }
  }

  // Eventos
  selectEjercicio.addEventListener("change", renderizarGrafico);
  selectVista.addEventListener("change", renderizarGrafico);
  selectTiempo.addEventListener("change", renderizarGrafico);

  if (selectEjercicio.options.length > 0) {
    selectEjercicio.selectedIndex = 0;
    selectEjercicio.dispatchEvent(new Event("change"));
  }
});
