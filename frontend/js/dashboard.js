document.addEventListener("DOMContentLoaded", () => {
  const registros = JSON.parse(localStorage.getItem("sesion_entrenamiento")) || [];

  // 1. Peso Máximo
  if (registros.length > 0) {
    const pesoMax = Math.max(...registros.map(r => r.peso));
    const ejercicioPesoMax = registros.find(r => r.peso === pesoMax)?.ejercicio;
    document.querySelector(".box:nth-child(1) p").innerHTML = `
      <strong>${ejercicioPesoMax}</strong><br>${pesoMax} kg`;
  }

  // 2. Último entrenamiento
  const ultimo = registros[registros.length - 1];
  if (ultimo) {
    document.querySelector(".box:nth-child(2) p").innerHTML = `
      <strong>${ultimo.ejercicio}</strong><br>
      ${ultimo.series} series · ${ultimo.peso} kg`;
  }

  // 3. Series realizadas esta semana (en simulación: suma total)
  const totalSeries = registros.reduce((acc, r) => acc + (parseInt(r.series) || 0), 0);
  document.querySelector(".box:nth-child(3) p").innerHTML = `<strong>${totalSeries}</strong>`;
});
