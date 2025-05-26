document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formulario-entrenamiento");
  const tabla = document.getElementById("tabla-resumen").querySelector("tbody");
  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  const claveHistorial = "historial_" + usuario.nombre.toLowerCase();

  let ejerciciosSesion = [];

  formulario.addEventListener("submit", e => {
    e.preventDefault();

    const ejercicio = document.getElementById("ejercicio").value.trim();
    const peso = parseFloat(document.getElementById("peso").value);
    const repeticiones = parseInt(document.getElementById("repeticiones").value);
    const series = parseInt(document.getElementById("series").value);

    // Validaciones
    if (!ejercicio) return alert("Selecciona un ejercicio válido.");
    if (isNaN(peso) || peso <= 0) return alert("El peso debe ser mayor a 0.");
    if (isNaN(repeticiones) || repeticiones < 1) return alert("Repeticiones debe ser 1 o más.");
    if (isNaN(series) || series < 1) return alert("Series debe ser 1 o más.");

    const nuevoEjercicio = { ejercicio, peso, repeticiones, series };

    // Agregar a la lista
    ejerciciosSesion.push(nuevoEjercicio);
    actualizarTabla();

    // Guardar en LocalStorage (simula base de datos temporal)
    localStorage.setItem("sesion_entrenamiento", JSON.stringify(ejerciciosSesion));

    // Limpiar campos
    formulario.reset();
  });

  function actualizarTabla() {
    tabla.innerHTML = "";
    ejerciciosSesion.forEach((e, index) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${e.ejercicio}</td>
        <td>${e.peso} kg</td>
        <td>${e.repeticiones}</td>
        <td>${e.series}</td>
        <td><button onclick="eliminarEjercicio(${index})">Eliminar</button></td>
      `;
      tabla.appendChild(fila);
    });
  }

  window.eliminarEjercicio = function(index) {
    ejerciciosSesion.splice(index, 1);
    localStorage.setItem("sesion_entrenamiento", JSON.stringify(ejerciciosSesion));
    actualizarTabla();
  };

  // Botón para vaciar toda la sesión
  document.getElementById("vaciarSesion").addEventListener("click", () => {
    if (confirm("¿Estás seguro de que deseas borrar toda la sesión?")) {
      ejerciciosSesion = [];
      localStorage.removeItem("sesion_entrenamiento");
      actualizarTabla();
    }
  });

  // Si había una sesión anterior (simulación de continuidad)
  const datosPrevios = JSON.parse(localStorage.getItem("sesion_entrenamiento"));
  if (datosPrevios) {
    ejerciciosSesion = datosPrevios;
    actualizarTabla();
  }
});

const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
const claveHistorial = "historial_" + usuario.nombre.toLowerCase();

document.getElementById("finalizarSesion").addEventListener("click", () => {
  if (ejerciciosSesion.length === 0) {
    alert("No hay ejercicios registrados.");
    return;
  }

  const nuevaSesion = {
    fecha: new Date().toISOString(),
    ejercicios: ejerciciosSesion
  };

  const historial = JSON.parse(localStorage.getItem(claveHistorial)) || [];
  historial.push(nuevaSesion);
  localStorage.setItem(claveHistorial, JSON.stringify(historial));

  // Limpiar
  ejerciciosSesion = [];
  localStorage.removeItem("sesion_entrenamiento");
  actualizarTabla();
  alert("Sesión guardada con éxito.");
});
