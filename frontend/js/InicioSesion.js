document.getElementById('InicioSesionForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Previene el envío real del formulario
  
    const Contraseña = document.getElementById('Contraseña').value;
    const Correo = document.getElementById('Correo').value;
  
    // Validación sencilla
    if (Contraseña.trim() === '' || Correo.trim() === '') {
      alert("camposVacios")
      return;
    }
  
    // Aquí puedes hacer algo con los datos, como enviarlos a un servidor
    console.log('Contraseña:', Contraseña);
    console.log('Correo:', Correo);
  
    document.getElementById('mensaje').textContent = '¡Formulario enviado correctamente!';
  });
  