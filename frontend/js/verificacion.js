document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const resendBtn = document.getElementById('resend-btn');
    const emailDisplay = document.getElementById('email-display');
    const btnText = resendBtn.querySelector('.btn-text');
    const spinner = resendBtn.querySelector('.spinner-border');
    
    // Mostrar el correo del usuario si está autenticado
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Mostrar el correo del usuario
            emailDisplay.innerHTML = `
                <i class="fas fa-envelope me-2"></i>
                <strong>${user.email}</strong>
            `;
            
            // Verificar si el correo ya está verificado
            if (user.emailVerified) {
                // Si ya está verificado, redirigir al dashboard
                window.location.href = 'Dashboard.html';
            }
        } else {
            // Si no hay usuario autenticado, redirigir al inicio de sesión
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
        
        // Mostrar spinner y deshabilitar botón
        resendBtn.disabled = true;
        spinner.classList.remove('d-none');
        btnText.textContent = 'Enviando...';
        
        // Reenviar correo de verificación con la configuración personalizada
        user.sendEmailVerification(actionCodeSettings)
            .then(() => {
                // Mostrar mensaje de éxito
                Swal.fire({
                    icon: 'success',
                    title: '¡Correo enviado!',
                    html: 'Hemos reenviado el correo de verificación a tu dirección de correo electrónico.<br><br>Por favor, revisa tu bandeja de entrada y sigue las instrucciones para verificar tu cuenta.',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#0d6efd'
                });
                
                // Deshabilitar el botón por 60 segundos
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
                console.error('Error al reenviar el correo:', error);
                
                let errorMessage = 'Ocurrió un error al enviar el correo de verificación. Por favor, inténtalo de nuevo más tarde.';
                
                if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Has realizado demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.';
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMessage,
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#0d6efd'
                });
                
                // Restaurar botón
                resendBtn.disabled = false;
                spinner.classList.add('d-none');
                btnText.textContent = 'Reenviar correo de verificación';
            });
    }
    
    // Verificar periódicamente si el correo ha sido verificado
    function verificarEstadoVerificacion() {
        const user = auth.currentUser;
        if (user) {
            user.reload().then(() => {
                if (user.emailVerified) {
                    // Mostrar mensaje de éxito y redirigir
                    Swal.fire({
                        icon: 'success',
                        title: '¡Correo verificado!',
                        text: 'Tu correo ha sido verificado correctamente.',
                        confirmButtonText: 'Continuar',
                        confirmButtonColor: '#198754',
                        allowOutsideClick: false
                    }).then(() => {
                        window.location.href = 'Dashboard.html';
                    });
                }
            });
        }
    }
    
    // Configurar el evento click del botón de reenvío
    resendBtn.addEventListener('click', reenviarCorreoVerificacion);
    
    // Verificar el estado de verificación cada 5 segundos
    setInterval(verificarEstadoVerificacion, 5000);
    
    // Verificar el estado de verificación al cargar la página
    verificarEstadoVerificacion();
});
