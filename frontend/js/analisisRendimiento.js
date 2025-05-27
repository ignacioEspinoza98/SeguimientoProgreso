document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  const claveHistorial = "historial_" + usuario.nombre.toLowerCase();
  const historial = JSON.parse(localStorage.getItem(claveHistorial)) || [];

  if (historial.length === 0) return;

  const selectEjercicio = document.getElementById("filtro-ejercicio");
  const selectVista = document.getElementById("vista-grafico");
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

  // Estadísticas
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

  // Cargar opciones en el select
  ejerciciosUnicos.forEach(nombre => {
    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = nombre;
    selectEjercicio.appendChild(opt);
  });

  // Función para renderizar gráfico según vista
  function renderizarGrafico() {
    const ejercicioSeleccionado = selectEjercicio.value;
    const vista = selectVista.value;
    if (!ejercicioSeleccionado) return;

    const datosFiltrados = [];

    historial.forEach(sesion => {
      sesion.ejercicios.forEach(e => {
        if (e.ejercicio === ejercicioSeleccionado) {
          datosFiltrados.push({
            fecha: new Date(sesion.fecha).toLocaleDateString(),
            peso: e.peso,
            series: e.series
          });
        }
      });
    });

    const labels = datosFiltrados.map(d => d.fecha);
    const valoresY = datosFiltrados.map(d => vista === "series" ? d.series : d.peso);

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
          fill: true
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
  }

  // Eventos
  selectEjercicio.addEventListener("change", renderizarGrafico);
  selectVista.addEventListener("change", renderizarGrafico);

  // Generar gráfico inicial
  if (selectEjercicio.options.length > 0) {
    selectEjercicio.selectedIndex = 0;
    selectEjercicio.dispatchEvent(new Event("change"));
  }
});
