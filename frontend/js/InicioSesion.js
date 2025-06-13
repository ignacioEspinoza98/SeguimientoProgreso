// Función para inicializar la página de inicio de sesión
function inicializarInicioSesion() {
    console.log('Inicializando página de inicio de sesión...');
    
    // Verificar si Firebase está cargado
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase no está cargado correctamente');
        mostrarErrorInicializacion('Error al cargar Firebase. Por favor, recarga la página.');
        return;
    }
    
    // Verificar si SweetAlert2 está cargado
    if (typeof Swal === 'undefined') {
        console.error('SweetAlert2 no está cargado correctamente');
        mostrarErrorInicializacion('Error al cargar las dependencias. Por favor, recarga la página.');
        return;
    }
    
    try {
        // Elementos del formulario
        const formInicioSesion = document.getElementById('InicioSesionForm');
        const btnIniciarSesion = document.getElementById('IniciarSesionBtn');
        const btnGoogle = document.getElementById('googleSignIn');
        const togglePasswordBtns = document.querySelectorAll('.toggle-password');
        
        if (!formInicioSesion || !btnIniciarSesion || !btnGoogle) {
            console.error('No se encontraron todos los elementos necesarios');
            return;
        }
        
        // Verificar el estado de autenticación
        firebase.auth().onAuthStateChanged(function(user) {
            console.log('Estado de autenticación cambiado:', user ? 'Usuario autenticado' : 'Usuario no autenticado');
            
            // No redirigir automáticamente, ya que manejamos la redirección en firebase-config.js
            // cuando se detecta un usuario autenticado en páginas de autenticación
            
            // Si por alguna razón llegamos aquí con un usuario autenticado, forzar cierre de sesión
            if (user) {
                console.log('Usuario autenticado detectado, cerrando sesión...');
                window.cerrarSesion && window.cerrarSesion().catch(console.error);
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
        
        // Iniciar sesión con correo y contraseña
        formInicioSesion.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Enviando formulario de inicio de sesión');
            
            const correo = document.getElementById('Correo').value.trim();
            const contraseña = document.getElementById('Contraseña').value;
            const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            // Validaciones
            if (!correo || !contraseña) {
                console.log('Validación fallida: Campos vacíos');
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos vacíos',
                    text: 'Por favor, completa todos los campos.',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#0d6efd'
                });
                return;
            }
            
            if (!correoRegex.test(correo)) {
                console.log('Validación fallida: Correo inválido');
                Swal.fire({
                    icon: 'warning',
                    title: 'Correo inválido',
                    text: 'Por favor, ingresa un correo electrónico válido.',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#0d6efd'
                });
                return;
            }
            
            console.log('Iniciando sesión con:', correo);
            
            // Mostrar spinner de carga
            const spinner = btnIniciarSesion.querySelector('.spinner-border');
            btnIniciarSesion.disabled = true;
            if (spinner) spinner.classList.remove('d-none');
            
            // Iniciar sesión con Firebase
            firebase.auth().signInWithEmailAndPassword(correo, contraseña)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log('Inicio de sesión exitoso:', user);
                    
                    // Verificar si el correo está verificado
                    if (!user.emailVerified) {
                        // Cerrar sesión para forzar la verificación
                        return firebase.auth().signOut().then(() => {
                            // Mostrar mensaje de verificación
                            return Swal.fire({
                                icon: 'warning',
                                title: '¡Verifica tu correo electrónico!',
                                html: `Por favor, verifica tu dirección de correo electrónico antes de iniciar sesión.<br><br>
                                      Hemos enviado un nuevo correo de verificación a <strong>${user.email}</strong>.<br><br>
                                      <small>¿No ves el correo? Revisa tu carpeta de <strong>spam</strong> o <strong>correo no deseado</strong>.</small>`,
                                confirmButtonText: 'Entendido',
                                confirmButtonColor: '#0d6efd',
                                allowOutsideClick: false
                            });
                        }).then(() => {
                            // Redirigir a la página de verificación
                            window.location.href = 'verificacion.html';
                        });
                    }
                    
                    // Si el correo está verificado, continuar con el inicio de sesión
                    console.log('Correo verificado, redirigiendo a Dashboard.html');
                    
                    // Guardar información del usuario en sessionStorage
                    const usuario = {
                        nombre: userCredential.user.displayName || userCredential.user.email.split('@')[0],
                        email: userCredential.user.email,
                        emailVerificado: userCredential.user.emailVerified,
                        uid: userCredential.user.uid
                    };
                    
                    sessionStorage.setItem('Logueado', 'true');
                    sessionStorage.setItem('usuario', JSON.stringify(usuario));
                    
                    console.log('Usuario guardado en sessionStorage:', usuario);
                    
                    // Usar ruta absoluta desde la raíz del sitio
                    const baseUrl = window.location.origin;
                    const dashboardUrl = `${baseUrl}/SeguimientoProgreso/frontend/html/Dashboard.html`;
                    console.log('Redirigiendo a:', dashboardUrl);
                    
                    // Usar replace para evitar problemas con el historial del navegador
                    window.location.replace(dashboardUrl);
                })
                .catch((error) => {
                    console.error('Error al iniciar sesión:', error);
                    if (typeof window.mostrarError === 'function') {
                        window.mostrarError(error);
                    } else {
                        console.error('La función mostrarError no está definida');
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo más tarde.',
                            confirmButtonText: 'Aceptar',
                            confirmButtonColor: '#0d6efd'
                        });
                    }
                })
                .finally(() => {
                    // Ocultar spinner de carga
                    btnIniciarSesion.disabled = false;
                    if (spinner) spinner.classList.add('d-none');
                });
        });
        
        // Iniciar sesión con Google
        if (btnGoogle) {
            btnGoogle.addEventListener('click', function() {
                console.log('Iniciando sesión con Google');
                if (typeof window.loginWithGoogle === 'function') {
                    window.loginWithGoogle();
                } else {
                    console.error('La función loginWithGoogle no está definida');
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'La función de inicio de sesión con Google no está disponible en este momento.',
                        confirmButtonText: 'Aceptar',
                        confirmButtonColor: '#0d6efd'
                    });
                }
            });
        }
        
        // Manejar clic en "¿Olvidaste tu correo o contraseña?"
        const enlaceOlvidePassword = document.querySelector('a[href*="recuperar-contrasena.html"]');
        if (enlaceOlvidePassword) {
            enlaceOlvidePassword.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'recuperar-contrasena.html';
            });
        } else {
            console.warn('No se encontró el enlace de recuperación de contraseña');
        }

        console.log('Inicialización completada correctamente');
    } catch (error) {
        console.error('Error en la inicialización:', error);
        mostrarErrorInicializacion('Ocurrió un error al cargar la página. Por favor, recarga la página e inténtalo de nuevo.');
    }
}

// Función para mostrar errores de inicialización
function mostrarErrorInicializacion(mensaje) {
    console.error('Error de inicialización:', mensaje);
    
    // Mostrar mensaje de error en el DOM
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-inicializacion';
    errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ff4444; color: white; padding: 15px 25px; border-radius: 5px; z-index: 9999; max-width: 90%; text-align: center;';
    errorDiv.textContent = mensaje;
    document.body.appendChild(errorDiv);
    
    // Intentar con SweetAlert2 si está disponible
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error de inicialización',
            text: mensaje,
            confirmButtonText: 'Aceptar'
        });
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarInicioSesion);
} else {
    inicializarInicioSesion();
}
