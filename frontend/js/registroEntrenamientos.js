const ejerciciosPorGrupo = {
  Pecho: [
    "Press en máquina", "Press banca con mancuernas", "Press banca con barra",
    "Press inclinado en Smith", "Press inclinado mancuernas", "Aperturas en máquina"
  ],
  Espalda: [
    "Remo con barra", "Remo en máquina", "Remo bajo supino unilateral", "Remo en T prono",
    "Dominadas pronas", "Jalón con agarre supino", "Jalón en máquina neutro", "Jalón al pecho prono"
  ],
  Hombros: [
    "Press Arnold", "Press militar en máquina", "Elevaciones frontales", "Elevaciones laterales",
    "Aperturas inversas", "Laterales en máquina", "Laterales en polea"
  ],
  Bíceps: [
    "Curl con barra recta", "Curl concentración", "Curl martillo en polea",
    "Curl bayesiano en polea", "Curl en banco inclinado"
  ],
  Tríceps: [
    "Extensión tríceps unilateral", "Extensión de tríceps en cuerda", "Fondos en paralelas", "Press francés"
  ],
  Piernas: [
    "Sentadilla libre", "Sentadilla hack", "Peso muerto convencional", "Peso muerto rumano",
    "Prensa unilateral", "Extensión de cuádriceps", "Curl isquio sentado", "Step-up con mancuernas",
    "Zancadas caminando", "Buenos días", "Hip thrust con barra", "Aductores"
  ],
  Gemelos: [
    "Gemelos de pie con barra", "Gemelos en prensa", "Gemelos (gastrocnemio)"
  ],
  Abdomen: [
    "Crunch en máquina", "Plancha abdominal", "Rueda abdominal"
  ]
};

// Guardar la lista de ejercicios por grupo en localStorage si no existe
if (!localStorage.getItem('ejerciciosPorGrupo')) {
  localStorage.setItem('ejerciciosPorGrupo', JSON.stringify(ejerciciosPorGrupo));
}

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("formulario-entrenamiento");
  const selectGrupo = document.getElementById("grupoMuscular");
  const selectEjercicio = document.getElementById("ejercicio");
  const pesoInput = document.getElementById("peso");
  const repeticionesInput = document.getElementById("repeticiones");
  const seriesInput = document.getElementById("series");
  const botonAgregar = formulario.querySelector("button[type='submit']");
  
  // Verificar si hay un ejercicio seleccionado previamente
  const ejercicioSeleccionado = sessionStorage.getItem('ejercicioSeleccionado');
  if (ejercicioSeleccionado) {
    try {
      const ejercicio = JSON.parse(ejercicioSeleccionado);
      // Seleccionar el grupo muscular
      selectGrupo.value = ejercicio.grupo;
      // Disparar el evento change para cargar los ejercicios
      const event = new Event('change');
      selectGrupo.dispatchEvent(event);
      
      // Esperar un momento para que se carguen los ejercicios
      setTimeout(() => {
        selectEjercicio.value = ejercicio.nombre;
        // Limpiar el ejercicio seleccionado para futuras cargas
        sessionStorage.removeItem('ejercicioSeleccionado');
      }, 100);
    } catch (e) {
      console.error('Error al cargar el ejercicio seleccionado:', e);
      sessionStorage.removeItem('ejercicioSeleccionado');
    }
  }
  
  // Cargar ejercicios guardados en la sesión actual al iniciar
  const sesionGuardada = localStorage.getItem("sesion_entrenamiento");
  if (sesionGuardada) {
    try {
      ejerciciosSesion = JSON.parse(sesionGuardada);
      actualizarTabla();
    } catch (e) {
      console.error('Error al cargar la sesión guardada:', e);
    }
  }

  const errorPeso = document.getElementById("errorPeso");
  const errorReps = document.getElementById("errorRepeticiones");
  const errorSeries = document.getElementById("errorSeries");

  for (const grupo in ejerciciosPorGrupo) {
    const opt = document.createElement("option");
    opt.value = grupo;
    opt.textContent = grupo;
    selectGrupo.appendChild(opt);
  }

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
    verificarFormulario();
  });

  function validarCampo(input, errorElement, nombreCampo) {
    const valor = input.value.trim();

    if (valor === "") {
      input.classList.remove("error", "validado");
      errorElement.textContent = "";
      return false;
    }

    const numero = Number(valor);
    if (isNaN(numero) || numero <= 0) {
      input.classList.add("error");
      input.classList.remove("validado");
      errorElement.textContent = `${nombreCampo} debe ser mayor a 0`;
      return false;
    } else {
      input.classList.remove("error");
      input.classList.add("validado");
      errorElement.textContent = "";
      return true;
    }
  }

  function verificarFormulario() {
    const pesoValido = validarCampo(pesoInput, errorPeso, "Peso");
    const repValido = validarCampo(repeticionesInput, errorReps, "Repeticiones");
    const seriesValido = validarCampo(seriesInput, errorSeries, "Series");
    const ejercicioValido = selectEjercicio.value.trim() !== "";

    botonAgregar.disabled = !(pesoValido && repValido && seriesValido && ejercicioValido);
  }

  [pesoInput, repeticionesInput, seriesInput, selectEjercicio].forEach(input => {
    input.addEventListener("input", verificarFormulario);
    input.addEventListener("change", verificarFormulario);
  });

  const tabla = document.getElementById("tabla-resumen").querySelector("tbody");
  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  const claveHistorial = "historial_" + usuario.nombre.toLowerCase();

  let ejerciciosSesion = [];
  let editando = false;
  let indexEditando = null;

  formulario.addEventListener("submit", e => {
    e.preventDefault();

    const grupoMuscular = selectGrupo.value;
    const ejercicio = selectEjercicio.value.trim();
    const peso = parseFloat(pesoInput.value);
    const repeticiones = parseInt(repeticionesInput.value);
    const series = parseInt(seriesInput.value);

    if (!ejercicio || isNaN(peso) || isNaN(repeticiones) || isNaN(series)) return;

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
    document.querySelectorAll("input").forEach(i => i.classList.remove("validado", "error"));
    botonAgregar.disabled = true;
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
    selectGrupo.value = e.grupoMuscular;
    selectGrupo.dispatchEvent(new Event("change"));
    setTimeout(() => {
      selectEjercicio.value = e.ejercicio;
    }, 100);

    pesoInput.value = e.peso;
    repeticionesInput.value = e.repeticiones;
    seriesInput.value = e.series;

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

  // Función para formatear la fecha como YYYY-MM-DD
  function formatearFecha(fecha) {
    return fecha.toISOString().split('T')[0];
  }

  // Función para guardar el entrenamiento en el historial
  function guardarEntrenamientoEnHistorial() {
    if (ejerciciosSesion.length === 0) {
      return false;
    }
    
    const fechaActual = formatearFecha(new Date());
    const historial = JSON.parse(localStorage.getItem(claveHistorial) || '[]');
    
    // Buscar si ya existe un entrenamiento para la fecha actual
    const entrenamientoHoy = historial.find(item => item.fecha === fechaActual) || {
      fecha: fechaActual,
      ejercicios: []
    };
    
    // Agregar los ejercicios de la sesión actual al entrenamiento del día
    entrenamientoHoy.ejercicios.push(...ejerciciosSesion);
    
    // Actualizar o agregar el entrenamiento del día en el historial
    const index = historial.findIndex(item => item.fecha === fechaActual);
    if (index !== -1) {
      historial[index] = entrenamientoHoy;
    } else {
      historial.push(entrenamientoHoy);
    }
    
    // Guardar en localStorage
    localStorage.setItem(claveHistorial, JSON.stringify(historial));
    return true;
  }

  // Evento para el botón Finalizar Sesión
  document.getElementById("finalizarSesion").addEventListener("click", () => {
    if (ejerciciosSesion.length === 0) {
      alert("No hay ejercicios en la sesión para guardar.");
      return;
    }
    
    if (confirm("¿Estás seguro de que deseas finalizar la sesión de entrenamiento?")) {
      const guardadoExitoso = guardarEntrenamientoEnHistorial();
      
      if (guardadoExitoso) {
        // Limpiar la sesión actual
        ejerciciosSesion = [];
        localStorage.removeItem("sesion_entrenamiento");
        actualizarTabla();
        
        // Mostrar mensaje de éxito
        const mensajeExito = document.createElement('div');
        mensajeExito.className = 'mensaje-exito';
        mensajeExito.textContent = '¡Sesión de entrenamiento guardada exitosamente!';
        document.querySelector('.resumen-acciones').appendChild(mensajeExito);
        
        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => {
          mensajeExito.style.opacity = '0';
          setTimeout(() => mensajeExito.remove(), 500);
        }, 3000);
        
        // Opcional: Redirigir al dashboard después de guardar
        // window.location.href = "Dashboard.html";
      } else {
        alert("Ocurrió un error al guardar la sesión. Por favor, inténtalo de nuevo.");
      }
    }
  });
  
  // Actualizar el estado del botón Finalizar Sesión
  function actualizarBotonFinalizar() {
    const botonFinalizar = document.getElementById("finalizarSesion");
    if (botonFinalizar) {
      botonFinalizar.disabled = ejerciciosSesion.length === 0;
    }
  }
  
  // Sobrescribir la función actualizarTabla para incluir la actualización del botón
  const actualizarTablaOriginal = actualizarTabla;
  actualizarTabla = function() {
    actualizarTablaOriginal();
    actualizarBotonFinalizar();
  };
  
  // Inicializar el estado del botón al cargar la página
  actualizarBotonFinalizar();
});
