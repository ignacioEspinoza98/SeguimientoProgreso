const ejerciciosPorGrupo = {
  Pecho: [
    "Press en máquina",
    "Press banca con mancuernas",
    "Press banca con barra",
    "Press inclinado en Smith",
    "Press inclinado mancuernas",
    "Aperturas en máquina"
  ],
  Espalda: [
    "Remo con barra",
    "Remo en máquina",
    "Remo bajo supino unilateral",
    "Remo en T prono",
    "Dominadas pronas",
    "Jalón con agarre supino",
    "Jalón en máquina neutro",
    "Jalón al pecho prono"
  ],
  Hombros: [
    "Press Arnold",
    "Press militar en máquina",
    "Elevaciones frontales",
    "Elevaciones laterales",
    "Aperturas inversas",
    "Laterales en máquina",
    "Laterales en polea"
  ],
  Bíceps: [
    "Curl con barra recta",
    "Curl concentración",
    "Curl martillo en polea",
    "Curl bayesiano en polea",
    "Curl en banco inclinado"
  ],
  Tríceps: [
    "Extensión tríceps unilateral",
    "Extensión de tríceps en cuerda",
    "Fondos en paralelas",
    "Press francés"
  ],
  Piernas: [
    "Sentadilla libre",
    "Sentadilla hack",
    "Peso muerto convencional",
    "Peso muerto rumano",
    "Prensa unilateral",
    "Extensión de cuádriceps",
    "Curl isquio sentado",
    "Step-up con mancuernas",
    "Zancadas caminando",
    "Buenos días",
    "Hip thrust con barra",
    "Aductores"
  ],
  Gemelos: [
    "Gemelos de pie con barra",
    "Gemelos en prensa",
    "Gemelos (gastrocnemio)"
  ],
  Abdomen: [
    "Crunch en máquina",
    "Plancha abdominal",
    "Rueda abdominal"
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formulario-entrenamiento");
  const selectGrupo = document.getElementById("grupoMuscular");
  const selectEjercicio = document.getElementById("ejercicio");

  // Cargar grupos musculares
  for (const grupo in ejerciciosPorGrupo) {
    const opt = document.createElement("option");
    opt.value = grupo;
    opt.textContent = grupo;
    selectGrupo.appendChild(opt);
  }

  // Al seleccionar un grupo, se actualizan los ejercicios
  selectGrupo.addEventListener("change", () => {
    const grupo = selectGrupo.value;
    selectEjercicio.innerHTML = '<option value="">Selecciona un ejercicio</option>';

    if (!grupo) {
      selectEjercicio.disabled = true;
      return;
    }

    ejerciciosPorGrupo[grupo].forEach(nombre => {
      const opt = document.createElement("option");
      opt.value = nombre;
      opt.textContent = nombre;
      selectEjercicio.appendChild(opt);
    });

    selectEjercicio.disabled = false;
  });

  const tabla = document.getElementById("tabla-resumen").querySelector("tbody");
  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  const claveHistorial = "historial_" + usuario.nombre.toLowerCase();

  let ejerciciosSesion = [];
  let editando = false;
  let indexEditando = null;
  const botonAgregar = formulario.querySelector("button[type='submit']");

  formulario.addEventListener("submit", e => {
    e.preventDefault();
    
    const grupoMuscular = document.getElementById("grupoMuscular").value;
    const ejercicio = document.getElementById("ejercicio").value.trim();
    const peso = parseFloat(document.getElementById("peso").value);
    const repeticiones = parseInt(document.getElementById("repeticiones").value);
    const series = parseInt(document.getElementById("series").value);

    if (!ejercicio) return alert("Selecciona un ejercicio válido.");
    if (isNaN(peso) || peso <= 0) return alert("El peso debe ser mayor a 0.");
    if (isNaN(repeticiones) || repeticiones < 1) return alert("Repeticiones debe ser 1 o más.");
    if (isNaN(series) || series < 1) return alert("Series debe ser 1 o más.");

    const nuevoEjercicio = { grupoMuscular, ejercicio, peso, repeticiones, series };


    if (editando) {
      ejerciciosSesion[indexEditando] = nuevoEjercicio;
      editando = false;
      indexEditando = null;
      botonAgregar.textContent = "Agregar ejercicio";
    } else {
      ejerciciosSesion.push(nuevoEjercicio);
    }

    actualizarTabla();
    localStorage.setItem("sesion_entrenamiento", JSON.stringify(ejerciciosSesion));
    formulario.reset();
  });

  function actualizarTabla() {
    tabla.innerHTML = "";
    ejerciciosSesion.forEach((e, index) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${e.grupoMuscular} - ${e.ejercicio}</td>
        <td>${e.peso} kg</td>
        <td>${e.repeticiones}</td>
        <td>${e.series}</td>
        <td>
          <button onclick="editarEjercicio(${index})">Editar</button>
          <button onclick="eliminarEjercicio(${index})">Eliminar</button>
        </td>
      `;
      tabla.appendChild(fila);
    });
  }

  window.eliminarEjercicio = function(index) {
    ejerciciosSesion.splice(index, 1);
    localStorage.setItem("sesion_entrenamiento", JSON.stringify(ejerciciosSesion));
    actualizarTabla();
  };

  window.editarEjercicio = function(index) {
    const e = ejerciciosSesion[index];
    document.getElementById("ejercicio").value = e.ejercicio;
    document.getElementById("peso").value = e.peso;
    document.getElementById("repeticiones").value = e.repeticiones;
    document.getElementById("series").value = e.series;

    editando = true;
    indexEditando = index;
    botonAgregar.textContent = "Actualizar ejercicio";
  };

  document.getElementById("vaciarSesion").addEventListener("click", () => {
    if (confirm("¿Estás seguro de que deseas borrar toda la sesión?")) {
      ejerciciosSesion = [];
      localStorage.removeItem("sesion_entrenamiento");
      actualizarTabla();
    }
  });

  const datosPrevios = JSON.parse(localStorage.getItem("sesion_entrenamiento"));
  if (datosPrevios) {
    ejerciciosSesion = datosPrevios;
    actualizarTabla();
  }

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

    ejerciciosSesion = [];
    localStorage.removeItem("sesion_entrenamiento");
    actualizarTabla();
    alert("Sesión guardada con éxito.");
  });
});
