// Configuración global
const actionCodeSettings = {
    url: window.location.origin + '/SeguimientoProgreso/frontend/html/verificacion.html',
    handleCodeInApp: true,
    // Configuración para el enlace de verificación
    iOS: {
        bundleId: 'com.progresogym.app'
    },
    android: {
        packageName: 'com.progresogym.app',
        installApp: true,
        minimumVersion: '12'
    },
    dynamicLinkDomain: 'progresogym.page.link',
    // Configuración adicional para el correo
    // Estos valores se usarán si no se configura la plantilla en Firebase Console
    // pero es mejor configurarlos directamente en Firebase Console
};

// Inicialización de Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Configuración de persistencia de Firestore
db.enablePersistence()
  .catch((err) => {
      if (err.code === 'failed-precondition') {
          console.warn('La persistencia solo puede estar habilitada en una pestaña a la vez.');
      } else if (err.code === 'unimplemented') {
          console.warn('El navegador actual no soporta todas las características requeridas');
      }
  });

// Función para mostrar errores con más detalles
function mostrarError(error, contexto = '') {
    console.error(`Error${contexto ? ' en ' + contexto : ''}:`, error);
    
    let mensaje = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
    let detallesTecnicos = '';
    
    // Mapeo de códigos de error a mensajes amigables
    const errores = {
        // Errores de autenticación
        'auth/email-already-in-use': 'Este correo ya está registrado. ¿Olvidaste tu contraseña?',
        'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
        'auth/weak-password': 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor, inténtalo más tarde.',
        'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a internet.',
        'auth/operation-not-allowed': 'Esta operación no está permitida. Contacta al soporte.',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
        'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
        'auth/wrong-password': 'La contraseña es incorrecta.',
        'auth/requires-recent-login': 'Por seguridad, debes iniciar sesión nuevamente para realizar esta acción.',
        
        // Errores de Firestore
        'permission-denied': 'No tienes permiso para realizar esta acción.',
        'unavailable': 'El servicio no está disponible en este momento. Por favor, inténtalo más tarde.'
    };
    
    // Buscar el mensaje de error correspondiente
    if (error.code && errores[error.code]) {
        mensaje = errores[error.code];
    } else if (error.message) {
        mensaje = error.message;
    }
    
    // Agregar detalles técnicos para depuración
    if (error.code) {
        detallesTecnicos = `Código: ${error.code}`;
    }
    
    // Mostrar el error con SweetAlert2
    return Swal.fire({
        icon: 'error',
        title: '¡Ups! Algo salió mal',
        html: `
            <p>${mensaje}</p>
            ${detallesTecnicos ? `<small class="text-muted">${detallesTecnicos}</small>` : ''}
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0d6efd',
        allowOutsideClick: false
    });
}

// Función para enviar correo de verificación
async function enviarCorreoVerificacion(user) {
    try {
        console.log('Enviando correo de verificación a:', user.email);
        await user.sendEmailVerification(actionCodeSettings);
        console.log('Correo de verificación enviado exitosamente');
        return true;
    } catch (error) {
        console.error('Error al enviar correo de verificación:', error);
        throw error;
    }
}

// Función para registrar un nuevo usuario
async function registrarUsuario(usuario, correo, contraseña) {
    try {
        console.log('Iniciando registro para:', correo);
        
        // 1. Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(correo, contraseña);
        const user = userCredential.user;
        console.log('Usuario creado exitosamente:', user.uid);
        
        // 2. Actualizar perfil con nombre de usuario
        await user.updateProfile({
            displayName: usuario
        });
        console.log('Perfil de usuario actualizado');
        
        // 3. Enviar correo de verificación
        await enviarCorreoVerificacion(user);
        
        // 4. Guardar datos adicionales en Firestore
        const userData = {
            uid: user.uid,
            usuario: usuario,
            correo: correo,
            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
            ultimaConexion: firebase.firestore.FieldValue.serverTimestamp(),
            rol: 'usuario',
            activo: true,
            emailVerificado: false
        };
        
        await db.collection('usuarios').doc(user.uid).set(userData);
        console.log('Datos del usuario guardados en Firestore');
        
        return user;
    } catch (error) {
        console.error('Error en el proceso de registro:', error);
        throw error;
    }
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando registro...');
    // Elementos del formulario
    const formRegistro = document.getElementById('RegistroForm');
    const btnRegistrar = document.getElementById('RegistroBtn');
    const inputContraseña = document.getElementById('Contraseña');
    const inputConfirmarContraseña = document.getElementById('ConfirmarContraseña');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    // Verificar que todos los elementos necesarios existan
    if (!formRegistro || !btnRegistrar || !inputContraseña || !inputConfirmarContraseña) {
        console.error('No se encontraron todos los elementos necesarios');
        return;
    }
    
    // Hacer funciones disponibles globalmente
    window.mostrarError = mostrarError;
    
    // Verificar si hay un usuario autenticado
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('Usuario autenticado detectado en página de registro, cerrando sesión...');
            auth.signOut().then(() => {
                console.log('Sesión cerrada correctamente');
            });
        }
    });
    
    // Función para mostrar/ocultar contraseña
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Validar coincidencia de contraseñas en tiempo real
    inputConfirmarContraseña.addEventListener('input', function() {
        if (inputContraseña.value !== this.value) {
            this.classList.add('is-invalid');
            document.getElementById('passwordMatch').style.display = 'block';
        } else {
            this.classList.remove('is-invalid');
            document.getElementById('passwordMatch').style.display = 'none';
        }
    });
    
    // Manejar el envío del formulario
    formRegistro.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Obtener valores del formulario
        const usuario = document.getElementById('Usuario').value.trim();
        const correo = document.getElementById('Correo').value.trim();
        const contraseña = inputContraseña.value;
        const confirmarContraseña = inputConfirmarContraseña.value;
        const terminos = document.getElementById('terminos').checked;
        
        // Expresiones regulares para validación
        const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usuarioRegex = /^[a-zA-Z0-9_]{4,20}$/;
        
        // Validaciones
        if (!usuario || !correo || !contraseña || !confirmarContraseña) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos vacíos',
                text: 'Por favor, completa todos los campos.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        if (!usuarioRegex.test(usuario)) {
            Swal.fire({
                icon: 'warning',
                title: 'Usuario inválido',
                text: 'El nombre de usuario debe tener entre 4 y 20 caracteres y solo puede contener letras, números, guiones y guiones bajos.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        if (!correoRegex.test(correo)) {
            Swal.fire({
                icon: 'warning',
                title: 'Correo inválido',
                text: 'Por favor, ingresa un correo electrónico válido.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        if (contraseña.length < 6) {
            Swal.fire({
                icon: 'warning',
                title: 'Contraseña débil',
                text: 'La contraseña debe tener al menos 6 caracteres.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        if (contraseña !== confirmarContraseña) {
            Swal.fire({
                icon: 'error',
                title: 'Las contraseñas no coinciden',
                text: 'Por favor, asegúrate de que las contraseñas sean iguales.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        if (!terminos) {
            Swal.fire({
                icon: 'warning',
                title: 'Términos y condiciones',
                text: 'Debes aceptar los términos y condiciones para continuar.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        // Mostrar spinner de carga
        const spinner = btnRegistrar.querySelector('.spinner-border');
        btnRegistrar.disabled = true;
        spinner.classList.remove('d-none');
        
        // Iniciar el proceso de registro
        registrarUsuario(usuario, correo, contraseña)
            .then((user) => {
                // Registro exitoso
                console.log('Proceso de registro completado para:', user.email);
                
                // Mostrar mensaje de éxito
                Swal.fire({
                    icon: 'success',
                    title: '¡Registro exitoso!',
                    html: `
                        <p>Se ha enviado un correo de verificación a <strong>${user.email}</strong>.</p>
                        <p class="mb-0">Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación.</p>
                    `,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#198754',
                    allowOutsideClick: false
                }).then(() => {
                    // Cerrar sesión y redirigir
                    return auth.signOut();
                }).then(() => {
                    // Redirigir a la página de verificación
                    window.location.href = `/SeguimientoProgreso/frontend/html/verificacion.html?email=${encodeURIComponent(user.email)}`;
                });
            })
            .catch((error) => {
                // Manejar errores
                console.error('Error en el registro:', error);
                btnRegistrar.disabled = false;
                spinner.classList.add('d-none');
                mostrarError(error, 'registro');
                
                // Intentar eliminar el usuario si se creó pero falló algo después
                if (auth.currentUser) {
                    auth.currentUser.delete().catch(e => {
                        console.error('No se pudo eliminar el usuario:', e);
                    });
                }
            });
    });
});