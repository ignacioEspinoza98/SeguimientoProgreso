// Elementos del DOM
const form = document.getElementById('RegistroForm');
const usuarioInput = document.getElementById('Usuario');
const correoInput = document.getElementById('Correo');
const passwordInput = document.getElementById('Contraseña');
const confirmPasswordInput = document.getElementById('ConfirmarContraseña');
const registroBtn = document.getElementById('RegistroBtn');

// Elementos de feedback
const usuarioFeedback = document.getElementById('usuarioFeedback');
const correoFeedback = document.getElementById('correoFeedback');
const passwordFeedback = document.getElementById('passwordFeedback');
const confirmPasswordFeedback = document.getElementById('confirmPasswordFeedback');

// Expresiones regulares
const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usuarioRegex = /^[a-zA-Z0-9_]{4,20}$/;

// Función para verificar si un correo ya está registrado
function verificarCorreoExistente(correo) {
    const datosUsuarios = JSON.parse(localStorage.getItem("Usuario")) || { usuarios: [] };
    return datosUsuarios.usuarios.some(usuario => usuario.correo === correo);
}

// Función para verificar si un usuario ya está registrado
function verificarUsuarioExistente(usuario) {
    const datosUsuarios = JSON.parse(localStorage.getItem("Usuario")) || { usuarios: [] };
    return datosUsuarios.usuarios.some(u => u.usuario === usuario);
}

// Función para mostrar mensajes de feedback
function mostrarFeedback(elemento, mensaje, tipo) {
    elemento.textContent = mensaje;
    elemento.className = `feedback ${tipo}`;
}

// Validación en tiempo real para el usuario
usuarioInput.addEventListener('input', function() {
    const usuario = this.value.trim();
    
    if (usuario === '') {
        mostrarFeedback(usuarioFeedback, 'El nombre de usuario es requerido', 'error');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
    } else if (!usuarioRegex.test(usuario)) {
        mostrarFeedback(usuarioFeedback, 'El usuario debe tener entre 4 y 20 caracteres (letras, números y guiones bajos)', 'error');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
    } else if (verificarUsuarioExistente(usuario)) {
        mostrarFeedback(usuarioFeedback, 'Este nombre de usuario ya está en uso', 'error');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
    } else {
        mostrarFeedback(usuarioFeedback, 'Nombre de usuario disponible', 'success');
        this.classList.add('is-valid');
        this.classList.remove('is-invalid');
    }
});

// Validación en tiempo real para el correo
correoInput.addEventListener('input', function() {
    const correo = this.value.trim();
    
    if (correo === '') {
        mostrarFeedback(correoFeedback, 'El correo electrónico es requerido', 'error');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
    } else if (!correoRegex.test(correo)) {
        mostrarFeedback(correoFeedback, 'Por favor, ingresa un correo electrónico válido', 'error');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
    } else if (verificarCorreoExistente(correo)) {
        mostrarFeedback(correoFeedback, 'Este correo electrónico ya está registrado', 'error');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
    } else {
        mostrarFeedback(correoFeedback, 'Correo electrónico disponible', 'success');
        this.classList.add('is-valid');
        this.classList.remove('is-invalid');
    }
});

// Validación en tiempo real para la contraseña
passwordInput.addEventListener('input', function() {
    const password = this.value;
    
    if (password === '') {
        mostrarFeedback(passwordFeedback, 'La contraseña es requerida', 'error');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
    } else if (password.length < 6) {
        mostrarFeedback(passwordFeedback, 'La contraseña debe tener al menos 6 caracteres', 'error');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
    } else {
        mostrarFeedback(passwordFeedback, 'Contraseña válida', 'success');
        this.classList.add('is-valid');
        this.classList.remove('is-invalid');
    }
    
    // Validar confirmación de contraseña si ya tiene valor
    if (confirmPasswordInput.value) {
        confirmPasswordInput.dispatchEvent(new Event('input'));
    }
});

// Validación en tiempo real para la confirmación de contraseña
confirmPasswordInput.addEventListener('input', function() {
    const password = passwordInput.value;
    const confirmPassword = this.value;
    
    if (confirmPassword === '') {
        mostrarFeedback(confirmPasswordFeedback, 'Por favor, confirma tu contraseña', 'error');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
    } else if (confirmPassword !== password) {
        mostrarFeedback(confirmPasswordFeedback, 'Las contraseñas no coinciden', 'error');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
    } else {
        mostrarFeedback(confirmPasswordFeedback, 'Las contraseñas coinciden', 'success');
        this.classList.add('is-valid');
        this.classList.remove('is-invalid');
    }
});

// Validación del formulario al enviar
form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Verificar que todos los campos sean válidos
    const esValido = 
        usuarioInput.classList.contains('is-valid') &&
        correoInput.classList.contains('is-valid') &&
        passwordInput.classList.contains('is-valid') &&
        confirmPasswordInput.classList.contains('is-valid');
    
    if (!esValido) {
        alert('Por favor, completa correctamente todos los campos');
        return;
    }
    
    // Crear nuevo usuario
    const usuarioNuevo = {
        usuario: usuarioInput.value.trim(),
        contraseña: passwordInput.value,
        correo: correoInput.value.trim()
    };
    
    // Guardar en localStorage
    const datosUsuarios = JSON.parse(localStorage.getItem("Usuario")) || { usuarios: [] };
    datosUsuarios.usuarios.push(usuarioNuevo);
    localStorage.setItem("Usuario", JSON.stringify(datosUsuarios));
    
    // Limpiar formulario y redirigir
    form.reset();
    alert('Usuario registrado exitosamente');
      window.location.href = "InicioSesion.html";
  });
  