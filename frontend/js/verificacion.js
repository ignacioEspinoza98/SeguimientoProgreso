document.addEventListener('DOMContentLoaded', function () {
    const auth = window.firebaseServices.auth;
    const resendBtn = document.getElementById('resend-btn');
    const emailDisplay = document.getElementById('email-display');
    const btnText = resendBtn.querySelector('.btn-text');
    const spinner = resendBtn.querySelector('.spinner-border');

    // Mostrar el correo del usuario si está autenticado
    auth.onAuthStateChanged((user) => {
        if (user) {
            emailDisplay.innerHTML = `
                <i class="fas fa-envelope me-2"></i>
                <strong>${user.email}</strong>
            `;

            if (user.emailVerified) {
                window.location.href = '/frontend/html/Dashboard.html';
            }
        } else {
            window.location.href = 'InicioSesion.html';
        }
    });

    // Función para reenviar el correo de verificación
    function reenviarCorreoVerificacion() {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = 'InicioSesion.html';
            return;
        }

        resendBtn.disabled = true;
        spinner.classList.remove('d-none');
        btnText.textContent = 'Enviando...';

        user.sendEmailVerification(window.actionCodeSettings)
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: '¡Correo enviado!',
                    html: `Revisa tu correo <strong>${user.email}</strong> para verificar tu cuenta.`,
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#0d6efd'
                });

                let seconds = 60;
                const interval = setInterval(() => {
                    btnText.textContent = `Reenviar (${seconds}s)`;
                    seconds--;
                    if (seconds < 0) {
                        clearInterval(interval);
                        resendBtn.disabled = false;
                        spinner.classList.add('d-none');
                        btnText.textContent = 'Reenviar correo de verificación';
                    }
                }, 1000);
            })
            .catch((error) => {
                console.error('Error al reenviar correo:', error);

                let mensaje = 'No se pudo enviar el correo. Intenta más tarde.';
                if (error.code === 'auth/too-many-requests') {
                    mensaje = 'Demasiados intentos. Espera unos minutos antes de reintentar.';
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: mensaje,
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#0d6efd'
                });

                resendBtn.disabled = false;
                spinner.classList.add('d-none');
                btnText.textContent = 'Reenviar correo de verificación';
            });
    }

    // Verificar si ya se verificó el correo
    function verificarEstadoVerificacion() {
        const user = auth.currentUser;
        if (user) {
            user.reload().then(() => {
                if (user.emailVerified) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Correo verificado!',
                        text: 'Redirigiendo a tu cuenta...',
                        confirmButtonText: 'Continuar',
                        confirmButtonColor: '#198754',
                        allowOutsideClick: false
                    }).then(() => {
                        window.location.href = '/frontend/html/Dashboard.html';
                    });
                }
            });
        }
    }

    resendBtn.addEventListener('click', reenviarCorreoVerificacion);
    setInterval(verificarEstadoVerificacion, 5000);
    verificarEstadoVerificacion();
});
