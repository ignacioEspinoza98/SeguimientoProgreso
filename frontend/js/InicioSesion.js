function inicializarInicioSesion() {
    console.log('Inicializando página de inicio de sesión...');

    const auth = window.firebaseServices.auth;
    const formInicioSesion = document.getElementById('InicioSesionForm');
    const btnIniciarSesion = document.getElementById('IniciarSesionBtn');
    const btnGoogle = document.getElementById('googleSignIn');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');

    if (!formInicioSesion || !btnIniciarSesion || !btnGoogle || !auth) {
        console.error('Faltan elementos del DOM o Firebase no está disponible');
        mostrarErrorInicializacion('No se pudo inicializar la aplicación correctamente.');
        return;
    }

    // Cierre de sesión forzado si hay sesión activa en páginas de autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('Usuario autenticado detectado, cerrando sesión...');
            window.cerrarSesion && window.cerrarSesion().catch(console.error);
        }
    });

    // Mostrar/ocultar contraseña
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    formInicioSesion.addEventListener('submit', async function (event) {
        event.preventDefault();
        const correo = document.getElementById('Correo').value.trim();
        const contraseña = document.getElementById('Contraseña').value;

        if (!correo || !contraseña) {
            return Swal.fire({ icon: 'warning', text: 'Completa todos los campos.' });
        }

        const spinner = btnIniciarSesion.querySelector('.spinner-border');
        btnIniciarSesion.disabled = true;
        if (spinner) spinner.classList.remove('d-none');

        try {
            const userCredential = await auth.signInWithEmailAndPassword(correo, contraseña);
            const user = userCredential.user;

            // ⚠️ Refrescar estado de verificación del correo
            await user.reload();

            if (!user.emailVerified) {
                await auth.signOut();

                return Swal.fire({
                    icon: 'warning',
                    title: 'Verifica tu correo',
                    html: `Hemos enviado un correo a <strong>${user.email}</strong>.`,
                    confirmButtonText: 'Entendido'
                }).then(() => {
                    window.location.href = 'verificacion.html';
                });
            }

            const usuario = {
                nombre: user.displayName || user.email.split('@')[0],
                usuario: user.displayName || user.email.split('@')[0],
                email: user.email,
                emailVerificado: user.emailVerified,
                uid: user.uid
            };

            sessionStorage.setItem('Logueado', 'true');
            sessionStorage.setItem('usuario', JSON.stringify(usuario));

            console.log('Usuario guardado en sessionStorage:', JSON.parse(sessionStorage.getItem('usuario')));

            const baseUrl = window.location.origin;
            window.location.replace(`${baseUrl}/SeguimientoProgreso/frontend/html/Dashboard.html`);
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            if (typeof window.mostrarError === 'function') {
                window.mostrarError(error);
            } else {
                Swal.fire({ icon: 'error', text: 'Error al iniciar sesión.' });
            }
        } finally {
            btnIniciarSesion.disabled = false;
            if (spinner) spinner.classList.add('d-none');
        }
    });

    if (btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            console.log('Iniciando sesión con Google');
            window.loginWithGoogle && window.loginWithGoogle();
        });
    }

    const enlaceOlvidePassword = document.querySelector('a[href*="recuperar-contrasena.html"]');
    if (enlaceOlvidePassword) {
        enlaceOlvidePassword.addEventListener('click', e => {
            e.preventDefault();
            window.location.href = 'recuperar-contrasena.html';
        });
    }

    console.log('Inicialización completada correctamente');
}

function mostrarErrorInicializacion(mensaje) {
    console.error('Error de inicialización:', mensaje);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-inicializacion';
    errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ff4444; color: white; padding: 15px 25px; border-radius: 5px; z-index: 9999; max-width: 90%; text-align: center;';
    errorDiv.textContent = mensaje;
    document.body.appendChild(errorDiv);

    if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'error', title: 'Error de inicialización', text: mensaje });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarInicioSesion);
} else {
    inicializarInicioSesion();
}
