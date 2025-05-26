document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  const claveHistorial = "historial_" + usuario.nombre.toLowerCase();
  const historial = JSON.parse(localStorage.getItem(claveHistorial)) || [];

  if (historial.length === 0) return;

  const selectEjercicio = document.getElementById("filtro-ejercicio");
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

  ejerciciosUnicos.forEach(nombre => {
    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = nombre;
    selectEjercicio.appendChild(opt);
    // Seleccionar automáticamente el primer ejercicio
if (selectEjercicio.options.length > 1) {
  selectEjercicio.selectedIndex = 1; // salta "Todos los ejercicios"
  selectEjercicio.dispatchEvent(new Event("change"));
}
  });
  

  // Escuchar cambio y generar gráfico
  selectEjercicio.addEventListener("change", () => {
    const ejercicioSeleccionado = selectEjercicio.value;
    if (!ejercicioSeleccionado || ejercicioSeleccionado === "todos") return;

    const datosFiltrados = [];

    historial.forEach(sesion => {
      sesion.ejercicios.forEach(e => {
        if (e.ejercicio === ejercicioSeleccionado) {
          datosFiltrados.push({
            fecha: new Date(sesion.fecha).toLocaleDateString(),
            peso: e.peso
          });
        }
      });
    });

    const labels = datosFiltrados.map(d => d.fecha);
    const pesos = datosFiltrados.map(d => d.peso);

    // Destruir gráfico anterior si existe
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `Progreso - ${ejercicioSeleccionado}`,
          data: pesos,
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
            ticks: {
              color: '#fff'
            }
          },
          x: {
            ticks: {
              color: '#fff'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#fff'
            }
          }
        }
      }
    });
  });
});
