document.addEventListener('DOMContentLoaded', async function () {
    const auth = window.firebaseServices.auth;
    const resendBtn = document.getElementById('resend-btn');
    const emailDisplay = document.getElementById('email-display');
    const btnText = resendBtn.querySelector('.btn-text');
    const spinner = resendBtn.querySelector('.spinner-border');

    // 1. PROCESAR OOB CODE DESDE URL SI EXISTE
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
        try {
            await auth.applyActionCode(oobCode);
            await auth.currentUser?.reload();

            Swal.fire({
                icon: 'success',
                title: '¡Correo verificado!',
                text: 'Tu cuenta ha sido verificada. Serás redirigido en unos segundos...',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true
            }).then(() => {
                window.location.href = '/frontend/html/InicioSesion.html';
            });

        } catch (error) {
            console.error('Error aplicando código de verificación:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de verificación',
                text: 'El enlace de verificación no es válido o ha expirado.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#dc3545'
            });
        }
    }

    const estaVerificando = (mode === 'verifyEmail' && oobCode);

    // 2. MOSTRAR EL CORREO DEL USUARIO
    auth.onAuthStateChanged((user) => {
        if (estaVerificando) return; // Evita redirección automática mientras se procesa la verificación

        if (user) {
            emailDisplay.innerHTML = `
                <i class="fas fa-envelope me-2"></i>
                <strong>${user.email}</strong>
            `;

            if (user.emailVerified) {
                window.location.href = '/frontend/html/Dashboard.html';
            }
        } else {
            window.location.href = '/frontend/html/InicioSesion.html';
        }
    });

    // 3. REENVIAR CORREO DE VERIFICACIÓN
    function reenviarCorreoVerificacion() {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = '/frontend/html/InicioSesion.html';
            return;
        }

        resendBtn.disabled = true;
        spinner.classList.remove('d-none');
        btnText.textContent = 'Enviando...';

        const actionCodeSettings = {
            url: 'https://seguimiento-entrenamiento.alphadocere.cl/frontend/html/verificacion.html',
            handleCodeInApp: true
        };

        user.sendEmailVerification(actionCodeSettings)
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

    resendBtn.addEventListener('click', reenviarCorreoVerificacion);
});
