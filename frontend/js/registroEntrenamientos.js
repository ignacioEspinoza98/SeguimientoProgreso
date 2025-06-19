document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      console.warn("Usuario no autenticado, redirigiendo al login...");
      window.location.href = "../html/InicioSesion.html";
    } else {
      console.log("Usuario autenticado al cargar la página:", user.uid);
    }
  });
});

// Variables globales
let ejerciciosSesion = [];
let editando = false;
let indexEditando = null;
let ejerciciosPorGrupo = {};

// Usar las funciones de firebase-config.js
const firebaseGuardarSesion = window.guardarSesion;
const firebaseMostrarError = window.mostrarError;

// Verificar si las funciones están disponibles
if (typeof firebaseGuardarSesion !== 'function') {
  console.error('La función guardarSesion no está disponible');
}

if (typeof firebaseMostrarError !== 'function') {
  console.error('La función mostrarError no está disponible');
}

// Inicializar ejerciciosPorGrupo con valores por defecto
const ejerciciosPorGrupoDefault = {
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

// Función para cargar los ejercicios por grupo
function cargarEjerciciosPorGrupo() {
  console.log('Iniciando carga de ejercicios por grupo...');
  try {
    // Verificar si el selector existe
    const selectGrupo = document.getElementById('grupoMuscular');
    console.log('Selector de grupo encontrado:', !!selectGrupo);
    
    if (!selectGrupo) {
      console.error('No se encontró el selector de grupo muscular');
      return;
    }
    // Usar directamente los valores por defecto
    console.log('Definiendo ejercicios por grupo...');
    ejerciciosPorGrupo = {
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
    
    console.log('Ejercicios cargados correctamente. Grupos disponibles:', Object.keys(ejerciciosPorGrupo));
    
    // Usar el selector que ya tenemos
    if (selectGrupo) {
      // Limpiar opciones existentes
      selectGrupo.innerHTML = '<option value="">Selecciona un grupo muscular</option>';
      
      // Llenar con los grupos musculares disponibles
      Object.keys(ejerciciosPorGrupo).forEach(grupo => {
        const opt = document.createElement('option');
        opt.value = grupo;
        opt.textContent = grupo;
        selectGrupo.appendChild(opt);
      });
      
      // Configurar el evento change
      selectGrupo.addEventListener('change', function() {
        const grupo = this.value;
        const selectEjercicio = document.getElementById('ejercicio');
        
        if (!selectEjercicio) return;
        
        selectEjercicio.innerHTML = '<option value="">Selecciona un ejercicio</option>';
        
        if (!grupo) {
          selectEjercicio.disabled = true;
          return;
        }
        
        ejerciciosPorGrupo[grupo].forEach(nombre => {
          const opt = document.createElement('option');
          opt.value = nombre;
          opt.textContent = nombre;
          selectEjercicio.appendChild(opt);
        });
        
        selectEjercicio.disabled = false;
      });
      
      // Activar el evento change para cargar los ejercicios del primer grupo
      if (selectGrupo.options.length > 1) {
        selectGrupo.dispatchEvent(new Event('change'));
      }
    }
  } catch (error) {
    console.error('Error al cargar los ejercicios:', error);
  }
}

// Función para llenar los selectores de grupos musculares y ejercicios
function llenarSelectores() {
  const selectGrupo = document.getElementById('grupoMuscular');
  if (!selectGrupo) return;
  
  // Limpiar opciones existentes
  selectGrupo.innerHTML = '<option value="">Selecciona un grupo muscular</option>';
  
  // Llenar con los grupos musculares disponibles
  Object.keys(ejerciciosPorGrupo).forEach(grupo => {
    const opt = document.createElement('option');
    opt.value = grupo;
    opt.textContent = grupo;
    selectGrupo.appendChild(opt);
  });
  
  // Activar el evento de cambio para cargar los ejercicios del primer grupo
  if (selectGrupo.options.length > 1) {
    selectGrupo.dispatchEvent(new Event('change'));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log('Evento DOMContentLoaded disparado');
  console.log('DOM completamente cargado');
  cargarEjerciciosPorGrupo();

  const formulario = document.getElementById("formulario-entrenamiento");
  const selectGrupo = document.getElementById("grupoMuscular");
  const selectEjercicio = document.getElementById("ejercicio");
  const seriesInput = document.getElementById("series");
  const contenedorSeries = document.getElementById("series-dinamicas");
  const botonAgregar = formulario.querySelector("button[type='submit']");
  const tabla = document.getElementById("tabla-resumen").querySelector("tbody");
  const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
  const claveHistorial = "historial_" + usuario.nombre.toLowerCase();

  if (!formulario || !selectGrupo || !selectEjercicio || !seriesInput || !contenedorSeries) return;

  let ejerciciosSesion = [];
  let editando = false;
  let indexEditando = null;

  selectGrupo.innerHTML = '<option value="">Selecciona un grupo muscular</option>';
  Object.keys(ejerciciosPorGrupo).forEach(grupo => {
    const opt = document.createElement('option');
    opt.value = grupo;
    opt.textContent = grupo;
    selectGrupo.appendChild(opt);
  });

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

  function verificarFormulario() {
    const grupoValido = selectGrupo.value.trim() !== "";
    const ejercicioValido = selectEjercicio.value.trim() !== "";

    const seriesValidas = Array.from(contenedorSeries.querySelectorAll(".peso-serie")).every(input => input.value > 0) &&
                          Array.from(contenedorSeries.querySelectorAll(".reps-serie")).every(input => input.value > 0);

    botonAgregar.disabled = !(grupoValido && ejercicioValido && seriesValidas);
  }

  seriesInput.addEventListener("input", () => {
    const cantidad = parseInt(seriesInput.value);
    contenedorSeries.innerHTML = "";
    if (isNaN(cantidad) || cantidad <= 0) return;

    for (let i = 0; i < cantidad; i++) {
      const grupo = document.createElement("div");
      grupo.className = "input-grupo-serie";
      grupo.innerHTML = `
        <div class="input-contenedor">
          <label>Peso (kg) - Serie ${i + 1}</label>
          <input type="number" class="peso-serie" required min="0" step="0.5" />
        </div>
        <div class="input-contenedor">
          <label>Repeticiones - Serie ${i + 1}</label>
          <input type="number" class="reps-serie" required min="1" />
        </div>
      `;
      contenedorSeries.appendChild(grupo);
    }

    agregarListenersDinamicos();
    verificarFormulario(); // Se vuelve a evaluar si el botón se puede activar
  });

  formulario.addEventListener("submit", e => {
    e.preventDefault();
    const grupo = selectGrupo.value;
    const ejercicio = selectEjercicio.value;
    const seriesDOM = contenedorSeries.querySelectorAll(".input-grupo-serie");

    const series = Array.from(seriesDOM).map(serie => {
      const peso = parseFloat(serie.querySelector(".peso-serie").value);
      const repeticiones = parseInt(serie.querySelector(".reps-serie").value);
      return { peso, repeticiones };
    }).filter(s => !isNaN(s.peso) && !isNaN(s.repeticiones));

    if (!grupo || !ejercicio || series.length === 0) return;

    const nuevoEjercicio = { grupo, nombre: ejercicio, series };
    if (editando) {
      ejerciciosSesion[indexEditando] = nuevoEjercicio;
      editando = false;
      indexEditando = null;
      botonAgregar.textContent = "Agregar ejercicio";
    } else {
      ejerciciosSesion.push(nuevoEjercicio);
    }
    localStorage.setItem("sesion_entrenamiento", JSON.stringify(ejerciciosSesion));
    actualizarTabla();
    formulario.reset();
    contenedorSeries.innerHTML = "";
    botonAgregar.disabled = true;
  });

  function agregarListenersDinamicos() {
    contenedorSeries.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", verificarFormulario);
      input.addEventListener("change", verificarFormulario);
    });
  }

  function actualizarTabla() {
    tabla.innerHTML = "";
    ejerciciosSesion.forEach((ej, index) => {
      const repsTotal = ej.series.reduce((acc, s) => acc + s.repeticiones, 0);
      const volumenTotal = ej.series.reduce((acc, s) => acc + (s.peso * s.repeticiones), 0);
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${ej.nombre} (${ej.grupo})</td>
        <td>${ej.series.map(s => s.peso).join(", ")} kg</td>
        <td>${ej.series.map(s => s.repeticiones).join(", ")}</td>
        <td>${ej.series.length}</td>
        <td>${volumenTotal.toFixed(2)} kg</td>
        <td>
          <button onclick="editarEjercicio(${index})">Editar</button>
          <button onclick="eliminarEjercicio(${index})">Eliminar</button>
        </td>
      `;
      tabla.appendChild(fila);
    });
    document.getElementById("finalizarSesion").disabled = ejerciciosSesion.length === 0;
  }

  window.editarEjercicio = function(index) {
    const ej = ejerciciosSesion[index];
    selectGrupo.value = ej.grupo;
    selectGrupo.dispatchEvent(new Event("change"));
    setTimeout(() => {
      selectEjercicio.value = ej.nombre;
    }, 100);
    seriesInput.value = ej.series.length;
    seriesInput.dispatchEvent(new Event("input"));
    setTimeout(() => {
      ej.series.forEach((s, i) => {
        const grupo = contenedorSeries.children[i];
        grupo.querySelector(".peso-serie").value = s.peso;
        grupo.querySelector(".reps-serie").value = s.repeticiones;
      });
    }, 100);
    editando = true;
    indexEditando = index;
    botonAgregar.textContent = "Actualizar ejercicio";
  };

  window.eliminarEjercicio = function(index) {
    ejerciciosSesion.splice(index, 1);
    localStorage.setItem("sesion_entrenamiento", JSON.stringify(ejerciciosSesion));
    actualizarTabla();
  };

  document.getElementById("vaciarSesion").addEventListener("click", () => {
    if (confirm("¿Estás seguro de que deseas borrar toda la sesión?")) {
      ejerciciosSesion = [];
      localStorage.removeItem("sesion_entrenamiento");
      actualizarTabla();
    }
  });

  document.getElementById("finalizarSesion")?.addEventListener("click", () => {
    if (ejerciciosSesion.length === 0) {
      alert("No hay ejercicios en la sesión para guardar.");
      return;
    }
    const boton = document.getElementById("finalizarSesion");
    boton.disabled = true;
    boton.textContent = "Guardando...";

    const sesion = {
      fecha: new Date().toISOString().split('T')[0],
      ejercicios: ejerciciosSesion.map(ej => ({
        nombre: ej.nombre,
        grupo: ej.grupo,
        series: ej.series.map(s => ({ peso: s.peso, repeticiones: s.repeticiones }))
      })),
      volumenTotal: ejerciciosSesion.reduce((acc, ej) => acc + ej.series.reduce((a, s) => a + (s.peso * s.repeticiones), 0), 0)
    };

    firebase.auth().onAuthStateChanged(async user => {
      if (user) {
        try {
          await window.guardarSesion(user.uid, sesion);
          ejerciciosSesion = [];
          localStorage.removeItem("sesion_entrenamiento");
          actualizarTabla();
          if (typeof Swal !== 'undefined') {
            await Swal.fire({ icon: 'success', title: 'Éxito', text: 'Sesión guardada exitosamente' });
          }
          window.location.href = "Dashboard.html";
        } catch (error) {
          console.error("Error al guardar sesión:", error);
          alert("Ocurrió un error al guardar la sesión");
          boton.disabled = false;
          boton.textContent = "Finalizar Sesión";
        }
      } else {
        alert("No estás autenticado.");
        boton.disabled = false;
        boton.textContent = "Finalizar Sesión";
      }
    });
  });

  // Evento para el botón Finalizar Sesión
  document.getElementById("finalizarSesion")?.addEventListener("click", () => {
    if (ejerciciosSesion.length === 0) {
      alert("No hay ejercicios en la sesión para guardar.");
      return;
    }

    if (confirm("¿Estás seguro de que deseas finalizar la sesión de entrenamiento?")) {
      guardarEntrenamientoEnHistorial();
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
